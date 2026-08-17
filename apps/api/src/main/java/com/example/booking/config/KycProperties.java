package com.example.booking.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Anti-money-laundering (AML) and KYC configuration for wallet operations.
 * All values can be overridden via environment variables / properties with the "kyc." prefix.
 */
@Component
@ConfigurationProperties(prefix = "kyc")
@Getter
@Setter
public class KycProperties {

    /** Maximum amount a BASIC-verified user can withdraw per day (NGN). */
    private BigDecimal basicDailyWithdrawalLimit = new BigDecimal("500000");

    /** Maximum amount a VERIFIED user can withdraw per day (NGN). */
    private BigDecimal verifiedDailyWithdrawalLimit = new BigDecimal("2000000");

    /** Maximum amount a BASIC-verified user can withdraw per calendar month (NGN). */
    private BigDecimal basicMonthlyWithdrawalLimit = new BigDecimal("2000000");

    /** Maximum amount a VERIFIED user can withdraw per calendar month (NGN). */
    private BigDecimal verifiedMonthlyWithdrawalLimit = new BigDecimal("10000000");

    /** Maximum deposit (NGN) per day for UNVERIFIED/PENDING users. */
    private BigDecimal unverifiedDailyDepositLimit = new BigDecimal("500000");

    /** Maximum deposit (NGN) per day for BASIC users. */
    private BigDecimal basicDailyDepositLimit = new BigDecimal("1000000");

    /** Maximum deposit (NGN) per day for VERIFIED users. */
    private BigDecimal verifiedDailyDepositLimit = new BigDecimal("5000000");

    /** Maximum number of withdrawal requests allowed per rolling hour. */
    private int maxWithdrawalsPerHour = 3;

    /** Maximum number of withdrawal requests allowed per day. */
    private int maxWithdrawalsPerDay = 10;

    /** Funds cannot be withdrawn for this many minutes after a completed deposit (anti money-mule). 0 disables. */
    private int withdrawalCooldownAfterDepositMinutes = 5;

    /** Transactions at or above this amount (NGN) are flagged for compliance review. */
    private BigDecimal largeSingleTransactionThreshold = new BigDecimal("1000000");

    /** When true, withdrawals are only allowed to the user's bound (verified) bank account. */
    private boolean requireBankBinding = true;
}
