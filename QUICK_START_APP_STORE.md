# Quick Start - App Store Submission

Quick reference guide for submitting Apartify Africa to the App Store.

## Prerequisites

- [x] Apple Developer account (active)
- [x] EAS configured
- [ ] App icon (1024x1024px) at `assets/icon.png`
- [ ] App screenshots (minimum 3 per device size)
- [ ] Privacy policy URL (publicly accessible)

## Quick Commands

```bash
# 1. Login to EAS
eas login

# 2. Configure credentials (first time only)
eas credentials

# 3. Build production app
eas build --platform ios --profile production

# 4. Submit to App Store (after build completes)
eas submit --platform ios --latest
```

## Step-by-Step

### 1. Prepare Assets
- Create 1024x1024px app icon → save as `assets/icon.png`
- Capture app screenshots (see APP_ICON_REQUIREMENTS.md for sizes)
- Create privacy policy page → get publicly accessible URL

### 2. Build App
```bash
eas build --platform ios --profile production
```
Wait 15-30 minutes for build to complete.

### 3. App Store Connect Setup
1. Go to https://appstoreconnect.apple.com
2. Create app: My Apps → + → New App
3. Complete:
   - App Information (category, privacy policy URL)
   - Pricing and Availability
   - App Privacy questionnaire

### 4. Upload Screenshots & Content
1. Go to App Store tab
2. Upload screenshots for each device size
3. Add app description (see APP_STORE_LISTING_CONTENT.md)
4. Add keywords, subtitle, etc.

### 5. Submit Build
```bash
eas submit --platform ios --latest
```
Or upload manually via Transporter/Xcode.

### 6. Submit for Review
1. In App Store Connect, select the processed build
2. Complete all required sections
3. Click "Submit for Review"
4. Answer export compliance questions

## Important Files

- **APP_STORE_SUBMISSION_GUIDE.md** - Complete detailed guide
- **APP_STORE_LISTING_CONTENT.md** - Ready-to-use listing content
- **APP_STORE_CHECKLIST.md** - Submission checklist
- **APP_ICON_REQUIREMENTS.md** - Icon specifications
- **submit-to-app-store.sh** - Automated submission script (Mac/Linux)
- **submit-to-app-store.ps1** - Automated submission script (Windows)

## Required Information

**App Details:**
- Name: Apartify Africa
- Bundle ID: `com.nigerianapartments.app`
- Version: 1.0.0
- Build: 1 (auto-increments)

**Category:** Travel or Lifestyle

**Privacy Policy:** Required - must be publicly accessible URL

**Screenshots:** Minimum 3 per device size (iPhone 6.7", iPhone 6.5", iPad if supporting)

## Timeline

- **Build:** 15-30 minutes
- **Processing:** 10-30 minutes after upload
- **Review:** 24-48 hours (can take up to 7 days for first submission)

## Need Help?

- See **APP_STORE_SUBMISSION_GUIDE.md** for detailed instructions
- Check **APP_STORE_CHECKLIST.md** to track progress
- Use **APP_STORE_LISTING_CONTENT.md** for ready-to-use content

## Next Steps

1. Create app icon → `assets/icon.png`
2. Capture screenshots
3. Create privacy policy URL
4. Run build command
5. Complete App Store Connect setup
6. Submit for review

Good luck! 🚀


