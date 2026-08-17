package com.example.booking.dto.kyc;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Request to submit KYC documents for verification")
public class KycSubmitRequest {

    @NotBlank(message = "Document type is required (e.g., BVN, NIN, PASSPORT, DRIVERS_LICENSE)")
    @Pattern(regexp = "(?i)(BVN|NIN|PASSPORT|DRIVERS_LICENSE|NATIONAL_ID)",
            message = "Document type must be one of: BVN, NIN, PASSPORT, DRIVERS_LICENSE, NATIONAL_ID")
    @Schema(description = "Type of identity document", example = "BVN")
    private String documentType;

    @NotBlank(message = "Document number is required")
    @Size(min = 6, max = 30, message = "Document number must be between 6 and 30 characters")
    @Schema(description = "Identity document number (e.g., BVN/NIN). Stored masked.", example = "12345678901")
    private String documentNumber;
}
