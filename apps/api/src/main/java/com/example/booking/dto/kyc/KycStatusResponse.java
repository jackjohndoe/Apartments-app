package com.example.booking.dto.kyc;

import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;

@Value
@Builder
public class KycStatusResponse {
    String level;
    String documentType;
    String documentNumberMasked;
    String rejectionReason;
    OffsetDateTime submittedAt;
    OffsetDateTime reviewedAt;
    String boundBankCode;
    String boundBankAccountNumberMasked;
    String boundBankAccountName;
    OffsetDateTime boundBankVerifiedAt;
}
