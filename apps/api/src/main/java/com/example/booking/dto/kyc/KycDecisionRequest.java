package com.example.booking.dto.kyc;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Admin decision on a KYC submission")
public class KycDecisionRequest {

    @Schema(description = "Target verification level for approval: BASIC or VERIFIED", example = "BASIC")
    private String level;

    @Schema(description = "Rejection reason (required when rejecting)", example = "Document unreadable")
    private String reason;

    @Schema(description = "Optional bank code to bind on approval", example = "044")
    private String accountBank;

    @Schema(description = "Optional account number to bind on approval", example = "1234567890")
    private String accountNumber;
}
