package com.example.booking.service;

import com.example.booking.dto.compliance.ComplianceFlagResponse;
import com.example.booking.entity.ComplianceFlag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ComplianceService {

    void flag(Long userId, ComplianceFlag.Type type, ComplianceFlag.Severity severity, String reason, String metadata);

    void flag(Long userId, ComplianceFlag.Type type, ComplianceFlag.Severity severity, String reason);

    Page<ComplianceFlagResponse> listFlags(Boolean resolved, Pageable pageable);

    ComplianceFlagResponse resolveFlag(Long flagId, String note);

    long countOpenFlags();
}
