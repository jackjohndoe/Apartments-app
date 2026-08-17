package com.example.booking.controller;

import com.example.booking.dto.common.PageResponse;
import com.example.booking.dto.compliance.ComplianceFlagResponse;
import com.example.booking.dto.compliance.ComplianceResolveRequest;
import com.example.booking.dto.kyc.KycAdminResponse;
import com.example.booking.dto.kyc.KycDecisionRequest;
import com.example.booking.dto.wallet.WalletStatusRequest;
import com.example.booking.entity.ComplianceFlag;
import com.example.booking.entity.User;
import com.example.booking.entity.Wallet;
import com.example.booking.exception.BadRequestException;
import com.example.booking.exception.ResourceNotFoundException;
import com.example.booking.repository.WalletRepository;
import com.example.booking.repository.UserRepository;
import com.example.booking.security.AdminUserDetails;
import com.example.booking.service.AuditService;
import com.example.booking.service.ComplianceService;
import com.example.booking.service.KycService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/admin/compliance")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Compliance", description = "Admin-only KYC review, wallet freeze and AML flag management")
public class AdminComplianceController {

    private final KycService kycService;
    private final ComplianceService complianceService;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final AuditService auditService;

    public AdminComplianceController(KycService kycService,
                                     ComplianceService complianceService,
                                     UserRepository userRepository,
                                     WalletRepository walletRepository,
                                     AuditService auditService) {
        this.kycService = kycService;
        this.complianceService = complianceService;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.auditService = auditService;
    }

    private String actorName(AdminUserDetails admin) {
        return admin != null ? admin.getAdminUser().getEmail() : "admin";
    }

    @Operation(summary = "List KYC submissions awaiting review")
    @GetMapping("/kyc/pending")
    public ResponseEntity<PageResponse<KycAdminResponse>> getPendingKyc(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(PageResponse.from(kycService.listPending(PageRequest.of(page, size))));
    }

    @Operation(summary = "List all KYC submissions (excluding unverified users)")
    @GetMapping("/kyc")
    public ResponseEntity<PageResponse<KycAdminResponse>> getAllKyc(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(PageResponse.from(kycService.listAll(PageRequest.of(page, size))));
    }

    @Operation(summary = "Approve a user's KYC submission", description = "Sets the user's verification tier (BASIC or VERIFIED). Optionally binds a bank account (verified against the provider).")
    @PutMapping("/kyc/{userId}/approve")
    public ResponseEntity<KycAdminResponse> approveKyc(@PathVariable Long userId,
                                                       @RequestBody(required = false) KycDecisionRequest request,
                                                       @AuthenticationPrincipal AdminUserDetails admin) {
        KycDecisionRequest body = request != null ? request : new KycDecisionRequest();
        String accountBank = body.getAccountBank();
        String accountNumber = body.getAccountNumber();
        if (accountBank != null && accountBank.isBlank()) accountBank = null;
        if (accountNumber != null && accountNumber.isBlank()) accountNumber = null;
        if ((accountBank == null) != (accountNumber == null)) {
            throw new BadRequestException("Both accountBank and accountNumber are required when binding a bank account.");
        }
        return ResponseEntity.ok(kycService.approve(userId, body.getLevel(), accountBank, accountNumber, actorName(admin)));
    }

    @Operation(summary = "Reject a user's KYC submission")
    @PutMapping("/kyc/{userId}/reject")
    public ResponseEntity<KycAdminResponse> rejectKyc(@PathVariable Long userId,
                                                      @RequestBody KycDecisionRequest request,
                                                      @AuthenticationPrincipal AdminUserDetails admin) {
        return ResponseEntity.ok(kycService.reject(userId, request.getReason(), actorName(admin)));
    }

    @Operation(summary = "Set wallet status (freeze/unfreeze)", description = "Suspends or closes a wallet to block all deposits, withdrawals and fund movements.")
    @PatchMapping("/wallets/{userId}/status")
    @Transactional
    public ResponseEntity<?> setWalletStatus(@PathVariable Long userId,
                                             @RequestBody WalletStatusRequest request,
                                             @AuthenticationPrincipal AdminUserDetails admin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Wallet.Status status;
        try {
            status = Wallet.Status.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid wallet status: " + request.getStatus() + ". Allowed: ACTIVE, SUSPENDED, CLOSED");
        }

        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No wallet exists for user with ID: " + userId));

        Wallet.Status oldStatus = wallet.getStatus();
        wallet.setStatus(status);
        walletRepository.save(wallet);

        String reason = request.getReason() != null && !request.getReason().isBlank()
                ? request.getReason() : "Admin status change";
        auditService.logAction(user, "WALLET_STATUS_CHANGE", "Wallet", wallet.getId(),
                "Wallet status changed from " + oldStatus + " to " + status + " by " + actorName(admin) + ": " + reason);

        if (status != Wallet.Status.ACTIVE) {
            complianceService.flag(userId, ComplianceFlag.Type.WALLET_FROZEN,
                    ComplianceFlag.Severity.HIGH,
                    "Wallet " + status.name().toLowerCase() + " by admin: " + reason,
                    "walletId=" + wallet.getId() + ", actor=" + actorName(admin));
        }

        return ResponseEntity.ok(java.util.Map.of(
                "status", "success",
                "walletStatus", status.name(),
                "reason", reason
        ));
    }

    @Operation(summary = "List compliance flags (AML alerts)")
    @GetMapping("/flags")
    public ResponseEntity<PageResponse<ComplianceFlagResponse>> getFlags(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "resolved", required = false) Boolean resolved) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ComplianceFlagResponse> flags = complianceService.listFlags(resolved, pageable);
        return ResponseEntity.ok(PageResponse.from(flags));
    }

    @Operation(summary = "Resolve a compliance flag")
    @PatchMapping("/flags/{id}/resolve")
    public ResponseEntity<ComplianceFlagResponse> resolveFlag(@PathVariable Long id,
                                                              @RequestBody(required = false) ComplianceResolveRequest request,
                                                              @AuthenticationPrincipal AdminUserDetails admin) {
        String note = request != null ? request.getNote() : null;
        return ResponseEntity.ok(complianceService.resolveFlag(id, note));
    }
}
