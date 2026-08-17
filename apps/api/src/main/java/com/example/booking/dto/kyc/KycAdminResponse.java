package com.example.booking.dto.kyc;

import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;

@Value
@Builder
public class KycAdminResponse {
    Long userId;
    String name;
    String email;
    String phone;
    String role;
    String kycLevel;
    String documentType;
    String documentNumberMasked;
    String rejectionReason;
    OffsetDateTime submittedAt;
    OffsetDateTime reviewedAt;
    String boundBankCode;
    String boundBankAccountNumber;
    String boundBankAccountName;
    OffsetDateTime boundBankVerifiedAt;
}
