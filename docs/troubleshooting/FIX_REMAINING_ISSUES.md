# Fix Remaining App Store Submission Issues

You have **3 remaining issues** to fix before submitting:

## Issue 1: Select Primary Category

**Location**: App Store listing page (not App Information)

**Steps**:
1. Navigate to: **Distribution** → **iOS App** → **1.0 Prepare for Submission**
2. Scroll down to the **App Store Information** section (or **General App Information** section)
3. Look for **"Primary Category"** dropdown field
4. Click the dropdown and select: **Travel** or **Lifestyle** (best for apartment/rental app)
5. If you don't see it there, try:
   - **App Store** → **App Information** → Look for category dropdown
   - OR in **General** → **App Information** → There might be a "Category" section

**Alternative**: The primary category might be editable from the error message link on the "Prepare for Submission" page.

## Issue 2: Complete App Privacy (Admin Required)

**Location**: App Store → Trust & Safety → App Privacy

**Steps**:
1. Navigate to: **App Store** → **Trust & Safety** → **App Privacy**
2. Click **"Get Started"** or **"Add Privacy Types"**
3. Declare data collection by answering YES to:
   - **User Account**: Email, name (for authentication)
   - **Photos**: Yes (for profile pictures and apartment listings)
   - **Financial Information**: Yes (for payment processing via Flutterwave)
   - **Location Data**: If your app uses location features, select Yes
4. For each data type, specify:
   - How it's used (e.g., "Used for app functionality")
   - Whether it's linked to user identity
   - Whether it's used for tracking (for Issue 3, see below)
5. Click **Save** when done

**Note**: You need **Admin** role to complete this section.

## Issue 3: Fix NSUserTrackingUsageDescription Tracking Disclosure

You have **TWO OPTIONS**:

### Option A: Declare Tracking in App Privacy (QUICK - No Rebuild)

Since your current build (1.0.0 (12)) still contains `NSUserTrackingUsageDescription`, you can declare tracking:

1. In **App Privacy** section (same as Issue 2)
2. For any data types you collect, select **"Used for Tracking"**
3. Specify which data is used for tracking purposes
4. This allows you to submit with the current build

### Option B: Rebuild App Without Tracking (RECOMMENDED - Takes 15-30 min)

Since we already removed `NSUserTrackingUsageDescription` from `app.json`, rebuild without it:

1. **Commit and push** the `app.json` changes:
   ```bash
   git add app.json
   git commit -m "Remove NSUserTrackingUsageDescription - tracking not implemented"
   git push
   ```

2. **Rebuild** via EAS web interface or CLI:
   ```bash
   eas build --platform ios --profile production
   ```

3. **Wait** for build to complete (~15-30 minutes)

4. **Upload new build** to App Store Connect via EAS:
   ```bash
   eas submit --platform ios --latest
   ```
   OR use the EAS web interface to submit the new build

5. After new build is processed, the tracking disclosure error will disappear

**Recommendation**: Option B is cleaner since you're not actually tracking users. But Option A is faster if you want to submit immediately.

## Quick Navigation URLs

- **Prepare for Submission**: https://appstoreconnect.apple.com/apps/6756714869/distribution/ios/version/inflight
- **App Privacy**: https://appstoreconnect.apple.com/apps/6756714869/distribution/privacy
- **App Information**: https://appstoreconnect.apple.com/apps/6756714869/distribution/info

## After Fixing All Issues

1. Return to **"Prepare for Submission"** page
2. Verify all 3 error messages are gone
3. Complete any remaining fields:
   - **Description** (required)
   - **Subtitle** (optional but recommended)
   - **Privacy Policy URL** (required)
   - **Support URL** (recommended)
   - **Build selection** (select build from TestFlight)
4. Click **"Add for Review"** button
5. Fill in **App Review Information** (if not already done):
   - Sign-in credentials (if app requires login)
   - Contact information
   - Notes (optional)
6. Click **"Submit for Review"**

## Priority Order

1. **Issue 2 (App Privacy)** - Most critical, requires Admin
2. **Issue 3 (Tracking)** - Choose Option A for speed or Option B for cleanliness
3. **Issue 1 (Primary Category)** - Usually straightforward once you find the field

Good luck! Once these are fixed, you'll be ready to submit for App Store review.






