package com.example.booking.dto.compliance;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Admin resolution of a compliance flag")
public class ComplianceResolveRequest {
    @Schema(description = "Note explaining how the flag was resolved", example = "Reviewed - legitimate large landlord payout")
    private String note;
}
