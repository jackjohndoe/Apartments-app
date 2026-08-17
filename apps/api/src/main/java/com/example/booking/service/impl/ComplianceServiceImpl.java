package com.example.booking.service.impl;

import com.example.booking.dto.compliance.ComplianceFlagResponse;
import com.example.booking.entity.ComplianceFlag;
import com.example.booking.entity.User;
import com.example.booking.exception.ResourceNotFoundException;
import com.example.booking.repository.ComplianceFlagRepository;
import com.example.booking.repository.UserRepository;
import com.example.booking.service.ComplianceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Slf4j
@Service
@Transactional
public class ComplianceServiceImpl implements ComplianceService {

    private final ComplianceFlagRepository flagRepository;
    private final UserRepository userRepository;

    public ComplianceServiceImpl(ComplianceFlagRepository flagRepository, UserRepository userRepository) {
        this.flagRepository = flagRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void flag(Long userId, ComplianceFlag.Type type, ComplianceFlag.Severity severity, String reason, String metadata) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                log.warn("Cannot create compliance flag: user {} not found", userId);
                return;
            }
            ComplianceFlag flag = ComplianceFlag.builder()
                    .user(user)
                    .type(type)
                    .severity(severity)
                    .reason(reason)
                    .metadata(metadata)
                    .resolved(false)
                    .build();
            flagRepository.save(flag);
            log.warn("Compliance flag created: user={}, type={}, severity={}, reason={}",
                    userId, type, severity, reason);
        } catch (Exception e) {
            log.error("Failed to create compliance flag for user {}: {}", userId, e.getMessage(), e);
        }
    }

    @Override
    public void flag(Long userId, ComplianceFlag.Type type, ComplianceFlag.Severity severity, String reason) {
        flag(userId, type, severity, reason, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplianceFlagResponse> listFlags(Boolean resolved, Pageable pageable) {
        Page<ComplianceFlag> flags;
        if (resolved != null) {
            flags = flagRepository.findByResolvedOrderByCreatedAtDesc(resolved, pageable);
        } else {
            flags = flagRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return flags.map(this::toResponse);
    }

    @Override
    public ComplianceFlagResponse resolveFlag(Long flagId, String note) {
        ComplianceFlag flag = flagRepository.findById(flagId)
                .orElseThrow(() -> new ResourceNotFoundException("Compliance flag not found with ID: " + flagId));
        flag.setResolved(true);
        flag.setResolvedNote(note);
        flag.setResolvedAt(OffsetDateTime.now());
        return toResponse(flagRepository.save(flag));
    }

    @Override
    public long countOpenFlags() {
        return flagRepository.countByResolved(false);
    }

    private ComplianceFlagResponse toResponse(ComplianceFlag flag) {
        User user = flag.getUser();
        return ComplianceFlagResponse.builder()
                .id(flag.getId())
                .userId(user != null ? user.getId() : null)
                .userName(user != null ? user.getName() : "Unknown")
                .userEmail(user != null ? user.getEmail() : "Unknown")
                .type(flag.getType().name())
                .severity(flag.getSeverity().name())
                .reason(flag.getReason())
                .metadata(flag.getMetadata())
                .resolved(flag.isResolved())
                .resolvedNote(flag.getResolvedNote())
                .createdAt(flag.getCreatedAt())
                .resolvedAt(flag.getResolvedAt())
                .build();
    }
}
