package com.example.booking.dto.admin;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Value
@Builder
public class AdminListingResponse {
    Long id;
    String title;
    String location;
    BigDecimal price;
    String hostName;
    String hostEmail;
    Double averageRating;
    Integer reviewCount;
    Integer photoCount;
    long bookingCount;
    OffsetDateTime createdAt;
}
