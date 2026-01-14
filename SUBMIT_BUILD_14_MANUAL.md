# How to Submit Build 1.0.0 (14) to App Store Connect

## Current Status
- ✅ Build 1.0.0 (14) is complete in EAS Build
- ❌ Build 14 has NOT been automatically submitted to App Store Connect
- ⏳ Build 14 needs to be manually submitted

## Option 1: Submit via EAS CLI (Recommended)

Run this command in your terminal:

```bash
cd "C:\Users\USER\Pictures\stage2\mobile app1 - Copy - Copy"
eas submit --platform ios --latest
```

**Note**: This will prompt you for:
- Apple ID (your Apple Developer account email)
- Password
- 2FA code (if enabled)

The command will automatically:
1. Find build 1.0.0 (14)
2. Upload it to App Store Connect
3. Process the submission

## Option 2: Submit via EAS Web Interface

Unfortunately, the EAS web interface doesn't have a direct "Submit" button. You'll need to use the CLI.

## Option 3: Manual Upload via App Store Connect

If CLI doesn't work, you can manually download and upload:

1. **Download the build from EAS**:
   - Go to: https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds
   - Click on build 1.0.0 (14)
   - Download the `.ipa` file

2. **Upload via App Store Connect**:
   - Go to: https://appstoreconnect.apple.com/apps/6756714869/testflight/ios/builds
   - Click "Build Upload" or use Transporter app
   - Upload the downloaded `.ipa` file

## After Submission

Once build 14 is submitted:
1. Wait 10-30 minutes for it to appear in TestFlight
2. Go to: https://appstoreconnect.apple.com/apps/6756714869/distribution/ios/version/inflight
3. Select build 1.0.0 (14) in the "Build" section
4. This will resolve the tracking disclosure error

## Quick Command

Run this in PowerShell:

```powershell
cd "C:\Users\USER\Pictures\stage2\mobile app1 - Copy - Copy"
eas submit --platform ios --latest
```

Then enter your Apple Developer credentials when prompted.



