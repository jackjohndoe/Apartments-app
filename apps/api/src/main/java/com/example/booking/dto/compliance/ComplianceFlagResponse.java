package com.example.booking.dto.compliance;

import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;

@Value
@Builder
public class ComplianceFlagResponse {
    Long id;
    Long userId;
    String userName;
    String userEmail;
    String type;
    String severity;
    String reason;
    String metadata;
    boolean resolved;
    String resolvedNote;
    OffsetDateTime createdAt;
    OffsetDateTime resolvedAt;
}
