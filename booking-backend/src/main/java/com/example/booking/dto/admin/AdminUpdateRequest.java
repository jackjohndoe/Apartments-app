package com.example.booking.dto.admin;

import lombok.Value;

@Value
public class AdminUpdateRequest {
    String name;
    String phone;
    String avatarUrl;
    String department;
    String permissions;
    String status;
    String notes;
}
