package com.example.booking.dto.admin;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Value
@Builder
public class AdminBookingResponse {
    Long id;
    Long listingId;
    String listingTitle;
    Long userId;
    String userName;
    String userEmail;
    String hostName;
    String hostEmail;
    LocalDate startDate;
    LocalDate endDate;
    BigDecimal totalPrice;
    String status;
    OffsetDateTime createdAt;
}
