package com.example.booking.dto.kyc;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to bind a bank account (must be in the user's own name)")
public class BindBankRequest {

    @NotBlank(message = "Account bank (bank code) is required")
    @Size(max = 10, message = "Bank code must be at most 10 characters")
    @Schema(description = "Bank code (e.g., 044 for Access Bank)", example = "044")
    private String accountBank;

    @NotBlank(message = "Account number is required")
    @Size(min = 8, max = 20, message = "Account number must be between 8 and 20 characters")
    @Pattern(regexp = "\\d+", message = "Account number must contain only digits")
    @Schema(description = "Bank account number", example = "1234567890")
    private String accountNumber;

    @Schema(description = "Account holder name - only used when the payment provider is not configured (local mode)",
            example = "John Doe")
    private String accountName;
}
