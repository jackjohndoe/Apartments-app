package com.example.booking.dto.wallet;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
@Schema(description = "Admin request to change a wallet's status (freeze/unfreeze)")
public class WalletStatusRequest {

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "(?i)(ACTIVE|SUSPENDED|CLOSED)",
            message = "Status must be one of: ACTIVE, SUSPENDED, CLOSED")
    @Schema(description = "New wallet status", example = "SUSPENDED")
    private String status;

    @Schema(description = "Reason for the status change (recorded for compliance)", example = "Suspected money laundering")
    private String reason;
}
