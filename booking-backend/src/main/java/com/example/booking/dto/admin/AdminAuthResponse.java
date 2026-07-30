package com.example.booking.dto.admin;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminAuthResponse {
    String token;
    Long adminId;
    String email;
    String name;
    String role;
}
