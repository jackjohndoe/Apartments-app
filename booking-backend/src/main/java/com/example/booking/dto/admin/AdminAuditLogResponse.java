package com.example.booking.dto.admin;

import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;

@Value
@Builder
public class AdminAuditLogResponse {
    Long id;
    Long userId;
    String userName;
    String userEmail;
    String action;
    String resourceType;
    Long resourceId;
    String description;
    String ipAddress;
    OffsetDateTime createdAt;
}
