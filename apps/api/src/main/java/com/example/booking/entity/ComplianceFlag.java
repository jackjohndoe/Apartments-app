package com.example.booking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "compliance_flags", indexes = {
        @Index(name = "idx_flag_user", columnList = "user_id"),
        @Index(name = "idx_flag_resolved", columnList = "resolved"),
        @Index(name = "idx_flag_created", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private Type type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Severity severity = Severity.MEDIUM;

    @Column(length = 500)
    private String reason;

    @Column(length = 2000)
    private String metadata;

    @Column(nullable = false)
    @Builder.Default
    private boolean resolved = false;

    @Column(name = "resolved_note", length = 500)
    private String resolvedNote;

    private OffsetDateTime createdAt;

    private OffsetDateTime resolvedAt;

    public enum Type {
        WITHDRAWAL_TO_UNBOUND_ACCOUNT,
        BANK_BINDING_MISMATCH,
        DEPOSIT_LIMIT_EXCEEDED,
        WITHDRAWAL_LIMIT_EXCEEDED,
        WITHDRAWAL_VELOCITY_EXCEEDED,
        RECENT_DEPOSIT_WITHDRAWAL,
        LARGE_TRANSACTION,
        WALLET_FROZEN,
        WALLET_FREEZE_ATTEMPT,
        KYC_REJECTED,
        KYC_APPROVED
    }

    public enum Severity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    @PrePersist
    public void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }
}
