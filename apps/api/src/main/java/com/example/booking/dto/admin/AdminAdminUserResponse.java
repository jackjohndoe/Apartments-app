package com.example.booking.dto.admin;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class AdminAdminUserResponse {
    Long id;
    String name;
    String email;
    String phone;
    String avatarUrl;
    String department;
    String permissions;
    String status;
    String notes;
    LocalDateTime lastLoginAt;
    LocalDateTime createdAt;
}
