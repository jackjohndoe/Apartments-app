package com.example.booking.dto.admin;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Value
@Builder
public class AdminTransactionResponse {
    Long id;
    Long userId;
    String userName;
    String userEmail;
    Long bookingId;
    String type;
    String status;
    BigDecimal amount;
    String currency;
    String description;
    String reference;
    OffsetDateTime createdAt;
    OffsetDateTime processedAt;
}
