package com.example.booking.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @Email
    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @NotBlank
    private String password;

    private String avatarUrl;

    @Column(length = 1000)
    private String bio;

    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @OneToMany(mappedBy = "host", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<Listing> listings = new HashSet<>();

    // Static virtual account fields for wallet funding
    @Column(name = "virtual_account_number")
    private String virtualAccountNumber;

    @Column(name = "virtual_account_bank")
    private String virtualAccountBank;

    @Column(name = "virtual_account_name")
    private String virtualAccountName;

    @Column(name = "virtual_account_flw_ref")
    private String virtualAccountFlwRef;

    @Column(name = "virtual_account_created_at")
    private java.time.LocalDateTime virtualAccountCreatedAt;

    // ===== KYC / AML fields =====
    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_level")
    @Builder.Default
    private KycLevel kycLevel = KycLevel.UNVERIFIED;

    @Column(name = "kyc_document_type", length = 40)
    private String kycDocumentType;

    @Column(name = "kyc_document_number_masked", length = 40)
    private String kycDocumentNumberMasked;

    @Column(name = "kyc_rejection_reason", length = 500)
    private String kycRejectionReason;

    @Column(name = "kyc_submitted_at")
    private java.time.OffsetDateTime kycSubmittedAt;

    @Column(name = "kyc_reviewed_at")
    private java.time.OffsetDateTime kycReviewedAt;

    // Verified withdrawal destination account (bound in the user's own name)
    @Column(name = "bound_bank_code", length = 10)
    private String boundBankCode;

    @Column(name = "bound_bank_account_number", length = 20)
    private String boundBankAccountNumber;

    @Column(name = "bound_bank_account_name", length = 200)
    private String boundBankAccountName;

    @Column(name = "bound_bank_verified_at")
    private java.time.OffsetDateTime boundBankVerifiedAt;

    public enum Role {
        GUEST,
        HOST
    }

    public enum KycLevel {
        UNVERIFIED(0),
        PENDING(1),
        BASIC(2),
        VERIFIED(3);

        private final int rank;

        KycLevel(int rank) {
            this.rank = rank;
        }

        public int getRank() {
            return rank;
        }

        public boolean isAtLeast(KycLevel other) {
            return other != null && this.rank >= other.rank;
        }
    }
}
