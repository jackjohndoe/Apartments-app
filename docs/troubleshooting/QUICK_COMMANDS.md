# Quick Commands for TestFlight Setup

Since you're logged in, here are the commands to run in order:

## Step 1: Verify Login
```bash
eas whoami
```
Should show your Expo username/email.

## Step 2: Configure EAS Project
```bash
eas build:configure
```
This verifies your EAS project setup. Your project ID is already configured: `2daf5ed9-4c43-4f7a-a6a8-ff18b325a97e`

## Step 3: Set Up iOS Credentials
```bash
eas credentials
```

**When prompted:**
1. Select **iOS**
2. Select **Set up new credentials** (or manage existing)
3. Choose **Let EAS handle credentials** (recommended)
4. Enter your Apple Developer account credentials when asked

EAS will automatically:
- Create distribution certificates
- Generate provisioning profiles
- Manage all credentials

## Step 4: (Optional) Add App Store Connect API Key

If you want EAS to automatically submit builds:

1. Create API key in [App Store Connect](https://appstoreconnect.apple.com) → Users and Access → Keys
2. Download the `.p8` file
3. Run: `eas credentials`
4. Select iOS → App Store Connect API Key
5. Enter Key ID, Issuer ID, and path to `.p8` file

## Step 5: Build iOS App
```bash
eas build --platform ios --profile production
```

**What happens:**
- Build starts in the cloud
- Takes 15-30 minutes
- You'll get email notifications
- Build URL will be shown in terminal

**Monitor progress:**
```bash
eas build:list
```

## Step 6: Submit to App Store Connect

**Option A: Automatic (if API key is set up)**
```bash
eas submit --platform ios --latest
```

**Option B: Manual**
1. Download `.ipa` from EAS build page
2. Use Transporter app or Xcode to upload

## Step 7: Set Up TestFlight

Go to [App Store Connect](https://appstoreconnect.apple.com):
1. Create app (if not already created)
2. Go to TestFlight tab
3. Add testers (Internal or External)
4. Submit for Beta Review (External only)

---

## Need Help?

- See `TESTFLIGHT_SETUP_GUIDE.md` for detailed instructions
- Check EAS dashboard: https://expo.dev
- EAS docs: https://docs.expo.dev/build/introduction/



