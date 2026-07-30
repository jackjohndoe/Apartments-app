# How to Submit Your Build to App Store Connect

## Current Status
✅ **Build Complete:** iOS App Store build 1.0.0 (12) is ready for submission

## Option 1: Submit via EAS CLI (Requires Manual Input)

You need to run this command **in your own terminal** (not automated) because it requires your Apple Developer credentials:

```bash
eas submit --platform ios --latest
```

**When prompted, you'll need:**
- Apple ID email (your Apple Developer account email)
- Apple ID password
- 2FA code (if enabled on your Apple Developer account)

**If you have 2FA enabled**, you may need to create an app-specific password:
1. Go to https://appleid.apple.com
2. Sign in → App-Specific Passwords
3. Generate a new password for "EAS Submit"
4. Use this password instead of your regular password

## Option 2: Submit via EAS Web Interface (Recommended)

1. Go to your EAS builds page:
   https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds

2. Find build **1.0.0 (12)** (the completed one)

3. Click on the build to open build details

4. Look for a **"Submit"** or **"Submit to App Store"** button

5. Follow the prompts to submit:
   - Select App Store Connect app (or create new)
   - Enter Apple Developer credentials
   - Confirm submission

## Option 3: Set Up App Store Connect API Key (For Future Automations)

This allows non-interactive submissions. Here's how:

### Step 1: Create API Key in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Click **Users and Access** (top right)
4. Go to **Keys** tab
5. Click **+** (Generate API Key)
6. Fill in:
   - **Name:** EAS Submit Key
   - **Access:** App Manager or Admin
7. Click **Generate**
8. **Download the key file** (.p8 file) - you can only download once!
9. **Copy the Key ID** (e.g., `ABC123XYZ`)
10. **Copy the Issuer ID** (found at the top of the Keys page)

### Step 2: Configure EAS with API Key

Run this command and follow prompts:

```bash
eas credentials
```

Select:
1. **iOS**
2. **Manage existing credentials** or **Set up credentials**
3. Choose to use App Store Connect API key
4. Provide:
   - Key ID (from Step 1)
   - Issuer ID (from Step 1)
   - Path to .p8 key file (or paste contents)

### Step 3: Update eas.json (Optional)

You can also configure the API key directly in `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_APP_ID",
        "appleId": "your-apple-id@example.com",
        "ascApiKeyPath": "./path/to/AuthKey_ABC123XYZ.p8",
        "ascApiKeyId": "ABC123XYZ",
        "ascApiIssuer": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  }
}
```

After setting up the API key, you can run `eas submit` without interactive prompts.

## Option 4: Manual Upload via Transporter (Mac Only)

1. Download the `.ipa` file from EAS dashboard:
   - Go to: https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds
   - Click on build 1.0.0 (12)
   - Download the `.ipa` file

2. Install Transporter app:
   - Download from Mac App Store
   - Open Transporter

3. Upload:
   - Drag and drop the `.ipa` file into Transporter
   - Click **Deliver**
   - Sign in with your Apple Developer account
   - Wait for upload to complete

4. Check App Store Connect:
   - Go to https://appstoreconnect.apple.com
   - My Apps → Your App → TestFlight → Builds
   - Wait 10-30 minutes for processing

## Next Steps After Submission

Once your build is submitted to App Store Connect:

1. **Wait for Processing** (10-30 minutes)
   - Check App Store Connect → TestFlight → Builds
   - Status will change from "Processing" to "Ready to Submit"

2. **Set Up App in App Store Connect** (if not done):
   - Create app "Apartify Africa"
   - Bundle ID: `com.nigerianapartments.app`
   - Complete App Information, Pricing, Privacy sections

3. **Complete App Store Listing**:
   - Screenshots (minimum 3 per device size)
   - App description
   - Keywords
   - Privacy Policy URL (REQUIRED)
   - Support URL

4. **Submit for Review**:
   - Select the processed build
   - Complete all required sections
   - Click "Submit for Review"

## Recommended Next Action

**Right now, you should:**

1. Open your terminal (PowerShell or Command Prompt)
2. Navigate to your project:
   ```bash
   cd "C:\Users\USER\Pictures\stage2\mobile app1 - Copy - Copy"
   ```
3. Run the submit command:
   ```bash
   eas submit --platform ios --latest
   ```
4. Enter your Apple Developer credentials when prompted

**OR** use the EAS web interface (Option 2 above) which is easier if you're not comfortable with the command line.

## Need Help?

- **EAS Submit Docs:** https://docs.expo.dev/submit/introduction/
- **App Store Connect:** https://appstoreconnect.apple.com
- **EAS Build Dashboard:** https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds







