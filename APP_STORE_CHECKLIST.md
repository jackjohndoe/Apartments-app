# App Store Submission Checklist

Use this checklist to track your App Store submission progress.

## Pre-Submission Requirements

### Assets
- [ ] App icon created (1024x1024px PNG)
- [ ] App icon saved to `assets/icon.png`
- [ ] App screenshots prepared (minimum 3 per device size):
  - [ ] iPhone 6.7" (1290x2796px) - 3-10 screenshots
  - [ ] iPhone 6.5" (1242x2688px) - 3-10 screenshots
  - [ ] iPad Pro 12.9" (2048x2732px) - 3-10 screenshots (if supporting iPad)
- [ ] App preview video (optional but recommended)

### Configuration
- [x] `app.json` updated with icon path
- [x] `eas.json` production profile configured
- [x] Bundle ID set: `com.nigerianapartments.app`
- [x] Version set: `1.0.0`
- [x] Build number set: `1`
- [x] iOS permissions configured
- [x] Export compliance set: `ITSAppUsesNonExemptEncryption: false`

### Content Preparation
- [ ] App description written (4000 characters max)
- [ ] App subtitle written (30 characters max)
- [ ] Keywords prepared (100 characters max)
- [ ] Promotional text written (170 characters, optional)
- [ ] "What's New" notes written for v1.0.0
- [ ] Privacy policy URL created and publicly accessible
- [ ] Support URL prepared
- [ ] Marketing URL prepared (optional)

## Build Process

### EAS Setup
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Logged in to EAS (`eas login`)
- [ ] Verified login (`eas whoami`)

### Credentials
- [ ] iOS credentials configured (`eas credentials`)
- [ ] Apple Developer account linked
- [ ] Distribution certificate created
- [ ] Provisioning profile generated
- [ ] App Store Connect API key created (optional but recommended)
- [ ] API key added to EAS credentials

### Build
- [ ] Production build started (`eas build --platform ios --profile production`)
- [ ] Build completed successfully
- [ ] Build email received
- [ ] Build status verified in EAS dashboard

## App Store Connect Setup

### App Creation
- [ ] App created in App Store Connect
- [ ] Bundle ID matches: `com.nigerianapartments.app`
- [ ] App name set: "Apartify Africa"
- [ ] Primary language: English
- [ ] SKU set: `apartify-africa-001`

### App Information
- [ ] Category selected (Travel or Lifestyle)
- [ ] Privacy Policy URL added (required)
- [ ] Support URL added
- [ ] Marketing URL added (optional)

### Pricing and Availability
- [ ] Price set (Free or Paid)
- [ ] Countries/regions selected
- [ ] Availability saved

### App Privacy
- [ ] Privacy questionnaire completed
- [ ] Data collection types specified:
  - [ ] User account data
  - [ ] Payment information
  - [ ] Photos
- [ ] Data usage specified
- [ ] Data sharing specified (Flutterwave)
- [ ] Privacy information saved

## App Store Listing

### App Store Tab
- [ ] Version 1.0.0 created
- [ ] Screenshots uploaded:
  - [ ] iPhone 6.7" screenshots (3-10)
  - [ ] iPhone 6.5" screenshots (3-10)
  - [ ] iPad Pro 12.9" screenshots (3-10, if supporting)
- [ ] App icon uploaded (1024x1024px)
- [ ] App preview video uploaded (optional)

### App Description
- [ ] Subtitle entered (30 characters)
- [ ] Description entered (4000 characters)
- [ ] Keywords entered (100 characters)
- [ ] Promotional text entered (optional)

### Version Information
- [ ] "What's New" notes entered
- [ ] Copyright information entered
- [ ] Trade Representative contact entered

### App Review Information
- [ ] Contact information entered
- [ ] Demo account provided (if app requires login)
- [ ] Notes for reviewers entered
- [ ] Review attachments uploaded (if needed)

## Submission

### Build Upload
- [ ] Build submitted to App Store Connect
  - [ ] Using EAS Submit: `eas submit --platform ios --latest`
  - [ ] Or manually uploaded via Transporter/Xcode
- [ ] Build processing completed (10-30 minutes)
- [ ] Build status: "Ready to Submit"

### Final Submission
- [ ] Build selected in App Store tab
- [ ] All required sections completed (green checkmarks)
- [ ] Export compliance questions answered:
  - [ ] Encryption: No
  - [ ] Content rights: Confirmed
  - [ ] Advertising identifier: Specified (if using)
- [ ] App submitted for review
- [ ] Submission confirmation received

## Post-Submission

### Review Process
- [ ] Submission status: "Waiting for Review"
- [ ] Review status monitored
- [ ] Email notifications enabled

### If Approved
- [ ] App status: "Ready for Sale"
- [ ] App released (automatic or manual)
- [ ] App appears in App Store (within 24 hours)
- [ ] Launch announcement prepared

### If Rejected
- [ ] Rejection reasons reviewed
- [ ] Issues identified
- [ ] Fixes implemented
- [ ] New build created
- [ ] Resubmitted for review

## Quick Reference

### Commands
```bash
# Login
eas login

# Check status
eas whoami

# Configure credentials
eas credentials

# Build
eas build --platform ios --profile production

# Check builds
eas build:list

# Submit
eas submit --platform ios --latest

# Check submissions
eas submit:list
```

### Important URLs
- App Store Connect: https://appstoreconnect.apple.com
- EAS Dashboard: https://expo.dev
- Apple Developer: https://developer.apple.com

### Support Resources
- EAS Documentation: https://docs.expo.dev/build/introduction/
- App Store Connect Help: https://help.apple.com/app-store-connect/
- Apple Review Guidelines: https://developer.apple.com/app-store/review/guidelines/

## Notes

- First submission typically takes 24-48 hours for review
- Can take up to 7 days for first-time submissions
- Privacy policy URL is mandatory
- Screenshots are required (minimum 3 per device size)
- Build number auto-increments (configured in eas.json)
- Version number must be incremented manually for updates

---

**Last Updated:** [Current Date]
**App Version:** 1.0.0
**Build Number:** 1


