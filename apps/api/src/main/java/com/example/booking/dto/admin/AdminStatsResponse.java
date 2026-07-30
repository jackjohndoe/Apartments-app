package com.example.booking.dto.admin;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminStatsResponse {
    long totalUsers;
    long totalHosts;
    long totalGuests;
    long totalListings;
    long totalBookings;
    long totalPhotos;
    java.math.BigDecimal totalRevenue;
    long activeBookings;
    long completedBookings;
}
