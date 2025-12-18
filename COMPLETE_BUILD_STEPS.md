# Complete iOS Build Steps

## ✅ Configuration Fixed

I've fixed the following issues:
- ✅ Added `ITSAppUsesNonExemptEncryption: false` to app.json (required by Apple)
- ✅ Added `appVersionSource: "remote"` to eas.json
- ✅ EAS token is configured

## 🚀 Next Steps (Run These Commands)

### Step 1: Set Up iOS Credentials

**Run this command:**
```powershell
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"
eas credentials
```

**When prompted:**
1. Select: **iOS**
2. Select: **Set up new credentials**
3. Select: **Let EAS handle credentials** (recommended)
4. When asked "Do you want to log in to your Apple account?" → **Yes**
5. Enter your **Apple Developer account email**
6. Enter your **Apple Developer account password**
7. If 2FA is enabled, enter the verification code

EAS will automatically:
- Create distribution certificates
- Generate provisioning profiles
- Validate everything

### Step 2: Build iOS App

**Run this command:**
```powershell
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"
eas build --platform ios --profile production
```

**What happens:**
- Build starts in the cloud
- Takes 15-30 minutes
- You'll receive email notifications
- Build URL will be shown in terminal

**Monitor progress:**
```powershell
eas build:list
```

### Step 3: Submit to App Store Connect

**After build completes, run:**
```powershell
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"
eas submit --platform ios --latest
```

**Note:** If you haven't set up App Store Connect API key, you'll need to:
1. Create app in App Store Connect (if not already created)
2. Upload the `.ipa` manually using Transporter app

## 📋 Quick Reference

**All commands (copy and paste):**
```powershell
# Set token
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"

# Step 1: Set up credentials
eas credentials

# Step 2: Build (after credentials are set up)
eas build --platform ios --profile production

# Step 3: Submit (after build completes)
eas submit --platform ios --latest
```

## ⚠️ Important Notes

1. **Token:** Set `$env:EXPO_TOKEN` in each new PowerShell session
2. **Credentials:** Only need to set up once - EAS will reuse them
3. **Build Time:** 15-30 minutes for first build
4. **Apple Account:** You need an active Apple Developer account ($99/year)

## 🆘 Troubleshooting

**If credentials setup fails:**
- Verify your Apple Developer account is active
- Check that you have the correct email/password
- Ensure 2FA is working if enabled

**If build fails:**
- Check build logs: `eas build:view [BUILD_ID]`
- Verify credentials: `eas credentials`
- Check EAS dashboard: https://expo.dev

## ✅ Checklist

- [ ] Run `eas credentials` and complete setup
- [ ] Run `eas build --platform ios --profile production`
- [ ] Wait for build to complete (check email)
- [ ] Run `eas submit --platform ios --latest`
- [ ] Set up TestFlight testers in App Store Connect

---

**Ready to start?** Run Step 1 above! 🚀



