package com.example.booking.service.impl;

import com.example.booking.dto.kyc.BindBankRequest;
import com.example.booking.dto.kyc.KycAdminResponse;
import com.example.booking.dto.kyc.KycStatusResponse;
import com.example.booking.dto.kyc.KycSubmitRequest;
import com.example.booking.entity.ComplianceFlag;
import com.example.booking.entity.User;
import com.example.booking.exception.BadRequestException;
import com.example.booking.exception.ResourceNotFoundException;
import com.example.booking.payment.FlutterwaveService;
import com.example.booking.repository.UserRepository;
import com.example.booking.service.AuditService;
import com.example.booking.service.ComplianceService;
import com.example.booking.service.KycService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Slf4j
@Service
@Transactional
public class KycServiceImpl implements KycService {

    private final UserRepository userRepository;
    private final FlutterwaveService flutterwaveService;
    private final ComplianceService complianceService;
    private final AuditService auditService;

    public KycServiceImpl(UserRepository userRepository,
                          FlutterwaveService flutterwaveService,
                          ComplianceService complianceService,
                          AuditService auditService) {
        this.userRepository = userRepository;
        this.flutterwaveService = flutterwaveService;
        this.complianceService = complianceService;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public KycStatusResponse getStatus(User user) {
        User fresh = userRepository.findById(user.getId()).orElse(user);
        return toStatusResponse(fresh);
    }

    @Override
    public KycStatusResponse submit(User user, KycSubmitRequest request) {
        User fresh = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + user.getId()));

        if (fresh.getKycLevel() != null && fresh.getKycLevel() == User.KycLevel.PENDING) {
            throw new BadRequestException("Your KYC submission is already pending review. " +
                    "Please wait for an administrator to review your documents.");
        }

        if (fresh.getKycLevel() != null && fresh.getKycLevel().isAtLeast(User.KycLevel.BASIC)) {
            throw new BadRequestException("Your identity is already verified at " + fresh.getKycLevel() +
                    " level. No further KYC submission is required.");
        }

        fresh.setKycLevel(User.KycLevel.PENDING);
        fresh.setKycDocumentType(request.getDocumentType().toUpperCase());
        fresh.setKycDocumentNumberMasked(mask(request.getDocumentNumber()));
        fresh.setKycRejectionReason(null);
        fresh.setKycSubmittedAt(OffsetDateTime.now());
        fresh.setKycReviewedAt(null);

        userRepository.save(fresh);
        auditService.logAction(fresh, "KYC_SUBMIT", "User", fresh.getId(),
                "KYC documents submitted: " + fresh.getKycDocumentType());

        log.info("KYC submitted for user {}: type={}", fresh.getId(), fresh.getKycDocumentType());
        return toStatusResponse(fresh);
    }

    @Override
    public void bindBankAccount(User user, BindBankRequest request) {
        User fresh = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + user.getId()));

        if (fresh.getKycLevel() == null || !fresh.getKycLevel().isAtLeast(User.KycLevel.BASIC)) {
            throw new BadRequestException("You must complete KYC verification (Basic tier or higher) " +
                    "before you can bind a bank account. Please submit your KYC documents first.");
        }

        String bankCode = request.getAccountBank() == null ? null : request.getAccountBank().trim();
        String accountNumber = request.getAccountNumber() == null ? null : request.getAccountNumber().trim();

        FlutterwaveService.ResolvedAccount resolved = flutterwaveService.resolveAccount(bankCode, accountNumber);
        String accountHolderName;

        if (resolved.isProviderAvailable()) {
            if (!resolved.isVerified() || resolved.getAccountName() == null || resolved.getAccountName().isBlank()) {
                complianceService.flag(fresh.getId(), ComplianceFlag.Type.BANK_BINDING_MISMATCH,
                        ComplianceFlag.Severity.HIGH,
                        "Bank account binding failed - provider could not verify the account",
                        "bank=" + bankCode + ", account=" + mask(accountNumber) + ", msg=" + resolved.getMessage());
                throw new BadRequestException("We could not verify this bank account with our provider. " +
                        "Please double-check the bank code and account number and try again.");
            }
            accountHolderName = resolved.getAccountName().trim();
            if (!namesMatch(accountHolderName, fresh.getName())) {
                complianceService.flag(fresh.getId(), ComplianceFlag.Type.BANK_BINDING_MISMATCH,
                        ComplianceFlag.Severity.CRITICAL,
                        "Bank account holder name does not match registered user name (potential mule account)",
                        "resolvedName=" + accountHolderName + ", user=" + fresh.getName() +
                                ", bank=" + bankCode + ", account=" + mask(accountNumber));
                throw new BadRequestException("The account holder name on this bank account ('" + accountHolderName +
                        "') does not match your registered name ('" + fresh.getName() +
                        "'). Bank accounts must be registered in your own name.");
            }
        } else {
            // Local/development mode without a payment provider: fall back to self-attested name match
            if (request.getAccountName() == null || request.getAccountName().isBlank()
                    || !namesMatch(request.getAccountName(), fresh.getName())) {
                throw new BadRequestException("In local mode, the account name must match your registered name " +
                        "('" + fresh.getName() + "') to bind a bank account.");
            }
            accountHolderName = request.getAccountName().trim();
            log.warn("Bank account bound in LOCAL mode (no provider configured): userId={}", fresh.getId());
        }

        fresh.setBoundBankCode(bankCode);
        fresh.setBoundBankAccountNumber(accountNumber);
        fresh.setBoundBankAccountName(accountHolderName);
        fresh.setBoundBankVerifiedAt(OffsetDateTime.now());

        userRepository.save(fresh);
        auditService.logAction(fresh, "BANK_BIND", "User", fresh.getId(),
                "Bound bank account " + mask(accountNumber) + " (" + bankCode + ") in name '" + accountHolderName + "'");
        log.info("Bank account bound for user {}: bank={}, account={}", fresh.getId(), bankCode, mask(accountNumber));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<KycAdminResponse> listPending(Pageable pageable) {
        return userRepository.findByKycLevel(User.KycLevel.PENDING, pageable).map(this::toAdminResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<KycAdminResponse> listAll(Pageable pageable) {
        return userRepository.findByKycLevelNotUnverified(pageable).map(this::toAdminResponse);
    }

    @Override
    public KycAdminResponse approve(Long userId, String targetLevel, String bankCode, String accountNumber, String actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        User.KycLevel level;
        if (targetLevel == null || targetLevel.isBlank()) {
            level = User.KycLevel.BASIC;
        } else {
            try {
                level = User.KycLevel.valueOf(targetLevel.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid KYC level: " + targetLevel + ". Allowed: BASIC, VERIFIED");
            }
        }
        if (level != User.KycLevel.BASIC && level != User.KycLevel.VERIFIED) {
            throw new BadRequestException("Invalid KYC level: " + targetLevel + ". Allowed: BASIC, VERIFIED");
        }

        // Optionally bind a bank account at approval time
        if (bankCode != null && !bankCode.isBlank() && accountNumber != null && !accountNumber.isBlank()) {
            bindBankAccount(user, new com.example.booking.dto.kyc.BindBankRequest(bankCode, accountNumber, null));
            user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        }

        user.setKycLevel(level);
        user.setKycRejectionReason(null);
        user.setKycReviewedAt(OffsetDateTime.now());
        userRepository.save(user);

        complianceService.flag(userId, ComplianceFlag.Type.KYC_APPROVED, ComplianceFlag.Severity.LOW,
                "KYC approved at " + level + " level" + (actor != null ? " by " + actor : ""),
                "documentType=" + user.getKycDocumentType());
        auditService.logAction(user, "KYC_APPROVE", "User", userId,
                "KYC approved at " + level + " by " + (actor != null ? actor : "admin"));

        log.info("KYC approved for user {} at level {} by {}", userId, level, actor);
        return toAdminResponse(user);
    }

    @Override
    public KycAdminResponse reject(Long userId, String reason, String actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (reason == null || reason.isBlank()) {
            throw new BadRequestException("A rejection reason is required.");
        }

        user.setKycLevel(User.KycLevel.UNVERIFIED);
        user.setKycRejectionReason(reason.trim());
        user.setKycReviewedAt(OffsetDateTime.now());
        userRepository.save(user);

        complianceService.flag(userId, ComplianceFlag.Type.KYC_REJECTED, ComplianceFlag.Severity.MEDIUM,
                "KYC rejected: " + reason + (actor != null ? " by " + actor : ""),
                "documentType=" + user.getKycDocumentType());
        auditService.logAction(user, "KYC_REJECT", "User", userId,
                "KYC rejected by " + (actor != null ? actor : "admin") + ": " + reason);

        log.info("KYC rejected for user {} by {}: {}", userId, actor, reason);
        return toAdminResponse(user);
    }

    private KycStatusResponse toStatusResponse(User user) {
        return KycStatusResponse.builder()
                .level(user.getKycLevel() != null ? user.getKycLevel().name() : User.KycLevel.UNVERIFIED.name())
                .documentType(user.getKycDocumentType())
                .documentNumberMasked(user.getKycDocumentNumberMasked())
                .rejectionReason(user.getKycRejectionReason())
                .submittedAt(user.getKycSubmittedAt())
                .reviewedAt(user.getKycReviewedAt())
                .boundBankCode(user.getBoundBankCode())
                .boundBankAccountNumberMasked(user.getBoundBankAccountNumber() != null
                        ? mask(user.getBoundBankAccountNumber()) : null)
                .boundBankAccountName(user.getBoundBankAccountName())
                .boundBankVerifiedAt(user.getBoundBankVerifiedAt())
                .build();
    }

    private KycAdminResponse toAdminResponse(User user) {
        return KycAdminResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .kycLevel(user.getKycLevel() != null ? user.getKycLevel().name() : User.KycLevel.UNVERIFIED.name())
                .documentType(user.getKycDocumentType())
                .documentNumberMasked(user.getKycDocumentNumberMasked())
                .rejectionReason(user.getKycRejectionReason())
                .submittedAt(user.getKycSubmittedAt())
                .reviewedAt(user.getKycReviewedAt())
                .boundBankCode(user.getBoundBankCode())
                .boundBankAccountNumber(user.getBoundBankAccountNumber())
                .boundBankAccountName(user.getBoundBankAccountName())
                .boundBankVerifiedAt(user.getBoundBankVerifiedAt())
                .build();
    }

    static String mask(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String v = value.trim();
        if (v.length() <= 4) {
            return "****" + v;
        }
        return "****" + v.substring(v.length() - 4);
    }

    static boolean namesMatch(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        String n1 = normalize(a);
        String n2 = normalize(b);
        return !n1.isEmpty() && (n1.equals(n2) || n1.contains(n2) || n2.contains(n1));
    }

    private static String normalize(String s) {
        return s.toLowerCase()
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
