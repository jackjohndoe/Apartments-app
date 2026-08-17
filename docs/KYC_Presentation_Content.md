# Apartify Africa — KYC & AML Compliance

---

## Slide 1: Why KYC Matters

- **Regulatory requirement** for financial services in Nigeria (CBN guidelines)
- Prevents money laundering, fraud, and identity theft
- Builds **user trust** — verified users feel safer transacting
- Unlocks **wallet withdrawals** — users can't cash out without KYC

---

## Slide 2: Verification Tiers

| Tier | Status | Capabilities |
|------|--------|-------------|
| **Unverified** | Default on signup | Browse, book apartments. No withdrawals. |
| **Pending** | Documents submitted | Awaiting admin review. Still no withdrawals. |
| **Basic** | Admin approved | Can bind bank account and withdraw funds. |
| **Fully Verified** | Admin approved (highest) | Full access to all platform features. |

**Gate rule:** Withdrawals are blocked until **Basic** tier or higher.

---

## Slide 3: User KYC Flow

```
1. User opens Wallet screen
2. Sees KYC banner if unverified
3. Taps "Complete Verification"
4. Selects document type (NIN, Voter's Card, Int'l Passport, Driver's License)
5. Enters document number
6. Submits → status changes to PENDING
7. Admin reviews in compliance dashboard
8. Approved → tier set to BASIC or VERIFIED
9. User can now bind a bank account for withdrawals
```

---

## Slide 4: Bank Account Binding

- User provides: **Bank name**, **Account number**, **Account holder name**
- Backend verifies the account against **Flutterwave** (Nigerian bank API)
- Account is bound to the user's profile
- **Only bound accounts** can receive withdrawals
- Binding requires **Basic KYC tier** or higher

**Why?** Prevents funds from being sent to accounts the user doesn't own.

---

## Slide 5: Admin Compliance Dashboard

Admins can:

- **View pending KYC submissions** — queue of users awaiting review
- **Approve** — set tier to Basic or Verified, optionally bind bank account
- **Reject** — provide a reason (e.g., "blurry document", "expired ID")
- **Freeze/unfreeze wallets** — suspend accounts for suspicious activity
- **Review AML flags** — automated alerts for risky behavior

All actions are **audit-logged** with the admin's email and timestamp.

---

## Slide 6: AML Compliance Flags

The system automatically flags suspicious activity:

| Flag | Trigger |
|------|---------|
| **Withdrawal to unbound account** | User tries to withdraw to an account not verified via KYC |
| **Bank binding mismatch** | Bank details don't match Flutterwave's verification |
| **Deposit limit exceeded** | Single deposit above threshold |
| **Withdrawal limit exceeded** | Single withdrawal above threshold |
| **Withdrawal velocity exceeded** | Too many withdrawals in short period |
| **Recent deposit + withdrawal** | Funds withdrawn shortly after deposit (layering) |
| **Large transaction** | Unusually large amount detected |
| **KYC rejected / approved** | Audit trail for verification decisions |

**Severity levels:** Low → Medium → High → Critical

---

## Slide 7: Security & Data Protection

- Document numbers are **masked** in the database (`kyc_document_number_masked`)
- Only the **last 4 digits** are stored in plain text
- Full document numbers are **never logged** or returned in API responses
- Bank account verification is done server-side via Flutterwave — no account numbers in frontend
- All compliance actions are **audit-logged** with admin identity and timestamp

---

## Slide 8: Technical Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Mobile App  │─────▶│  Spring Boot │─────▶│  PostgreSQL  │
│  (Expo RN)   │◀─────│  Backend     │◀─────│  Database    │
└─────────────┘      └──────┬───────┘      └─────────────┘
                            │
                     ┌──────▼───────┐
                     │  Flutterwave  │  (Bank account verification)
                     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │  Admin Panel  │  (KYC review + AML flags)
                     └──────────────┘
```

**Key endpoints:**
- `POST /api/kyc/submit` — user submits documents
- `GET /api/kyc/status` — check verification level
- `PUT /api/admin/compliance/kyc/{userId}/approve` — admin approves
- `PUT /api/admin/compliance/kyc/{userId}/reject` — admin rejects

---

## Slide 9: Compliance Summary

| Feature | Status |
|---------|--------|
| Multi-tier KYC (Unverified → Verified) | **Implemented** |
| Document submission & review | **Implemented** |
| Bank account binding via Flutterwave | **Implemented** |
| Withdrawal gating by KYC tier | **Implemented** |
| AML compliance flags (auto-detection) | **Implemented** |
| Wallet freeze/unfreeze by admin | **Implemented** |
| Audit logging for all admin actions | **Implemented** |
| Document number masking | **Implemented** |

---

## Slide 10: Next Steps

- **Document upload** — image upload of ID documents (currently text-based)
- **Automated verification** — integrate with NIBSS BVN or similar for instant verification
- **Webhook notifications** — notify admins of new KYC submissions in real-time
- **Batch review** — approve/reject multiple submissions at once
- **User-facing status history** — let users see their verification timeline

---

*Apartify Africa — Making apartment leasing safe and compliant across Nigeria.*
