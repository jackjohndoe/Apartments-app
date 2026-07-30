package com.example.booking.dto.admin;

import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;

@Value
@Builder
public class AdminUserResponse {
    Long id;
    String name;
    String email;
    String phone;
    String role;
    String avatarUrl;
    String location;
    long listingCount;
    long bookingCount;
    OffsetDateTime createdAt;
}
