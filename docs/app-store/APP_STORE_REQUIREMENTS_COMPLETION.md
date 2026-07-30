# App Store Requirements Completion Guide

## Status Summary

Based on the plan requirements, here are the remaining steps to complete App Store submission:

## ✅ Completed Actions

1. **Removed NSUserTrackingUsageDescription** - Since the app doesn't actually use tracking SDKs (no Facebook SDK, Google Analytics, etc.), I've removed this from `app.json`. This requires a rebuild, but prevents misleading privacy declarations.

## ⚠️ Browser-Based Actions Required

Due to App Store Connect requiring Admin access and interactive workflows, the following must be completed manually:

### 1. Set Price Tier to Free
**Location**: Pricing and Availability page
- Navigate to: App Store → Monetization → Pricing and Availability
- Click "Add Pricing" button
- In the dialog, click the "Price" button dropdown
- Select "$0.00" (Free)
- Click "Next" and complete the wizard
- Click "Save"

### 2. Complete Age Rating Questionnaire
**Location**: App Information page
- Navigate to: General → App Information
- Click "Set Up Age Rating" button
- For each category, select "None" for frequency:
  - Cartoon or Fantasy Violence: None
  - Realistic Violence: None
  - Profanity or Crude Humor: None
  - Sexual Content or Nudity: None
  - Alcohol, Tobacco, or Drug Use: None
  - Mature/Suggestive Themes: None
  - Gambling and Contests: None
  - Horror/Fear Themes: None
  - Medical/Treatment Information: None
  - Unrestricted Web Access: Possibly (if using WebView)
- Save age rating (should result in 4+ or 12+ rating)

### 3. Select Primary Category
**Location**: App Information page
- Navigate to: General → App Information
- Find "Primary Category" dropdown
- Select: **Travel** or **Lifestyle** (best for apartment/rental app)
- Save changes

### 4. Complete App Privacy Information (Admin Required)
**Location**: App Store → Trust & Safety → App Privacy
- Navigate as Admin user
- Complete privacy questionnaire:
  - **User account data**: Email, name (Yes - for authentication)
  - **Photos**: Yes (for profile pictures and listings)
  - **Financial information**: Yes (for payment processing via Flutterwave)
  - **Location data**: Possibly (if app uses location features)
- Specify data usage and sharing
- Save all privacy declarations

### 5. Verify Tracking Disclosure
Since `NSUserTrackingUsageDescription` has been removed from `app.json`:
- A new build will be required (the current build 1.0.0 (12) still has this permission)
- After rebuilding, the App Privacy section should no longer require tracking disclosure
- **OR** keep the current build and declare tracking in App Privacy if you prefer not to rebuild

## 🔨 Rebuild Required

Since we removed `NSUserTrackingUsageDescription`:
1. Commit and push the `app.json` changes
2. Run: `eas build --platform ios --profile production`
3. Wait for build to complete (~15-30 minutes)
4. Submit new build to App Store Connect

## Verification Checklist

After completing all steps:
- [ ] Price tier set to Free
- [ ] Age Rating questionnaire completed (all None for apartment app)
- [ ] Primary category selected (Travel or Lifestyle)
- [ ] App Privacy questionnaire completed (Admin)
- [ ] Tracking disclosure resolved (either removed via rebuild OR declared)
- [ ] All sections saved
- [ ] Return to "Prepare for Submission" page
- [ ] Verify all required items are checked off
- [ ] Complete remaining listing details (Description, Subtitle, Build selection, Privacy Policy URL)
- [ ] Click "Add for Review" to submit

## Notes

- Admin role required for App Privacy section
- Age rating should be straightforward for an apartment booking app (likely 4+ rating)
- Primary category "Travel" or "Lifestyle" both appropriate for rental marketplace
- Pricing typically set to "Free" for marketplace apps
- If keeping current build, you must declare tracking in App Privacy






