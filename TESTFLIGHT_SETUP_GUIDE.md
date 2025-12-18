# iOS TestFlight Build and Submission Guide

This guide walks you through the complete process of building your Nigerian Apartments app for iOS and submitting it to TestFlight.

## ✅ Completed Steps

1. ✅ Updated `app.json` with production iOS settings
2. ✅ Updated `eas.json` with production build configuration

## 📋 Step-by-Step Instructions

### Step 1: Login to EAS CLI

**Action Required:** Run this command in your terminal and follow the prompts:

```bash
eas login
```

- Enter your Expo account email/username
- Enter your password
- If you don't have an Expo account, create one at https://expo.dev

**Verify login:**
```bash
eas whoami
```

---

### Step 2: Configure EAS Project

**Action Required:** Run this command:

```bash
eas build:configure
```

This will verify your EAS project setup. Your project ID is already configured: `2daf5ed9-4c43-4f7a-a6a8-ff18b325a97e`

---

### Step 3: Set Up Apple Developer Credentials

**Action Required:** Run this command:

```bash
eas credentials
```

**Follow these prompts:**
1. Select **iOS** platform
2. Select **Set up new credentials** (or manage existing if you have them)
3. Choose **Let EAS handle credentials** (recommended)
4. EAS will automatically:
   - Create distribution certificates
   - Generate provisioning profiles
   - Manage all credentials for you

**Note:** You'll need your Apple Developer account credentials for this step.

---

### Step 4: Create App Store Connect API Key (Recommended)

This allows EAS to automatically submit builds to App Store Connect.

**Action Required - Web-based:**

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** → **Keys** tab
3. Click the **+** button to create a new key
4. Fill in:
   - **Name:** EAS Build Key (or any name you prefer)
   - **Access:** Select **App Manager** or **Admin** role
5. Click **Generate**
6. **IMPORTANT:** Download the `.p8` key file immediately (you can only download it once)
7. Note down:
   - **Key ID** (e.g., ABC123DEFG)
   - **Issuer ID** (found at the top of the Keys page, looks like: 12345678-1234-1234-1234-123456789012)

**Add to EAS:**

```bash
eas credentials
```

1. Select **iOS**
2. Select **App Store Connect API Key**
3. Enter:
   - **Key ID:** (from step 7 above)
   - **Issuer ID:** (from step 7 above)
   - **Key file path:** (path to the downloaded `.p8` file)

---

### Step 5: Create App in App Store Connect

**Action Required - Web-based:**

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in the form:
   - **Platform:** iOS
   - **Name:** Nigerian Apartments (or your preferred name)
   - **Primary Language:** English
   - **Bundle ID:** `com.nigerianapartments.app`
   - **SKU:** `nigerian-apartments-001` (any unique identifier)
   - **User Access:** Full Access
4. Click **Create**

---

### Step 6: Complete App Information in App Store Connect

**Action Required - Web-based:**

#### App Information Tab:
1. **Category:** Select **Travel** or **Lifestyle**
2. **Privacy Policy URL:** 
   - ⚠️ **REQUIRED** - You must have a publicly accessible privacy policy URL
   - Example: `https://yourwebsite.com/privacy-policy`
   - If you don't have one, create a simple privacy policy page

#### Pricing and Availability:
1. Set app as **Free** or **Paid**
2. Select countries/regions where the app will be available
3. Click **Save**

#### App Privacy:
1. Click **Get Started** or **Edit** in the App Privacy section
2. Complete the privacy questionnaire:
   - Answer questions about data collection
   - Specify what data you collect (if any)
   - Indicate how data is used
3. Click **Save**

---

### Step 7: Build the iOS App

**Action Required:** Run this command:

```bash
eas build --platform ios --profile production
```

**What happens:**
- EAS will build your app in the cloud
- Build typically takes **15-30 minutes**
- You'll receive email notifications when complete
- A build URL will be provided to track progress

**Monitor build progress:**
```bash
eas build:list
```

**Or check the build URL provided in the terminal**

---

### Step 8: Submit Build to App Store Connect

**Action Required:** Once the build is complete, run:

```bash
eas submit --platform ios --latest
```

**What happens:**
- EAS will automatically submit the latest build to App Store Connect
- The build will appear in App Store Connect under **TestFlight** tab
- Processing takes **10-30 minutes**

**Alternative (Manual Upload):**
If you prefer to upload manually:
1. Download the `.ipa` file from the EAS build page
2. Use the **Transporter** app (available on Mac App Store) or Xcode
3. Upload the `.ipa` file

---

### Step 9: Set Up TestFlight Testers

**Action Required - Web-based:**

Go to App Store Connect → Your App → **TestFlight** tab

#### Internal Testing (Recommended for First Test):
1. Click **Internal Testing** in the left sidebar
2. Click **+** to create a test group (e.g., "Internal Testers")
3. Select the build you just uploaded
4. Add testers:
   - Click **Add Testers**
   - Enter email addresses of team members (up to 100)
   - Testers will receive email invitations
5. Click **Save**

**Note:** Internal testing doesn't require Apple review - testers get immediate access!

#### External Testing (For Public Beta):
1. Click **External Testing** in the left sidebar
2. Click **+** to create a test group
3. Select the build
4. Add testers (up to 10,000)
5. **Complete Beta App Review** (see Step 10)

---

### Step 10: Beta App Review (External Testing Only)

**Action Required - Web-based (Only if using External Testing):**

1. In the External Testing section, click **Submit for Review**
2. Fill in:
   - **What to Test:** Describe what testers should focus on
   - **Contact Information:** Your email/phone
   - **Demo Account:** If your app requires login, provide test credentials
   - **Notes:** Any additional information for reviewers
3. Click **Submit**

**Review Time:** Typically 24-48 hours

---

### Step 11: Testers Install and Test

**What Testers Need to Do:**

1. **Install TestFlight:**
   - Download TestFlight app from the App Store (free)

2. **Accept Invitation:**
   - Open the email invitation from Apple
   - Click **View in TestFlight** or **Start Testing**
   - TestFlight app will open

3. **Install Your App:**
   - Tap **Install** next to your app
   - Wait for download and installation
   - Tap **Open** to launch

4. **Provide Feedback:**
   - Testers can submit feedback directly through TestFlight
   - Crash reports are automatically collected

---

### Step 12: Monitor Feedback

**In App Store Connect:**

1. Go to **TestFlight** tab
2. Check:
   - **Crash Reports:** View any crashes
   - **Tester Feedback:** Read feedback from testers
   - **Usage Analytics:** See how testers are using the app

---

## 🔧 Troubleshooting

### Build Fails
- Check build logs: `eas build:view [BUILD_ID]`
- Verify credentials: `eas credentials`
- Check for errors in the EAS dashboard

### Credential Issues
- Run `eas credentials` to manage certificates
- EAS can regenerate credentials if needed

### Submission Errors
- Verify App Store Connect API key has correct permissions
- Ensure app exists in App Store Connect
- Check that bundle ID matches exactly

### TestFlight Not Showing Build
- Wait 10-30 minutes for processing
- Check email for any issues
- Verify build was submitted successfully

---

## 📝 Important Notes

1. **Privacy Policy:** You MUST have a publicly accessible privacy policy URL before submission
2. **First Build:** May take longer as EAS sets up credentials (30-45 minutes)
3. **Processing:** App Store Connect processing takes 10-30 minutes after upload
4. **Beta Review:** Only required for external testing, not internal testing
5. **Version Numbers:** Update `version` in `app.json` for each new build
6. **Build Number:** iOS uses `buildNumber` - increment for each build

---

## 🎯 Next Steps After TestFlight

Once testing is complete:

1. **Fix Issues:** Address any bugs or feedback from testers
2. **Create New Build:** Run `eas build --platform ios --profile production` again
3. **Submit Updated Build:** Run `eas submit --platform ios --latest`
4. **Continue Testing:** Or proceed to App Store submission for production release

---

## 📞 Need Help?

- **EAS Documentation:** https://docs.expo.dev/build/introduction/
- **App Store Connect Help:** https://help.apple.com/app-store-connect/
- **EAS Support:** Check the EAS dashboard or Expo forums

---

## ✅ Checklist

- [ ] Logged in to EAS CLI
- [ ] Configured EAS project
- [ ] Set up Apple Developer credentials
- [ ] Created App Store Connect API key (optional but recommended)
- [ ] Created app in App Store Connect
- [ ] Completed App Information, Pricing, and Privacy sections
- [ ] Built iOS app with EAS
- [ ] Submitted build to App Store Connect
- [ ] Set up TestFlight testers
- [ ] Submitted for Beta Review (if external testing)
- [ ] Testers installed and testing app

Good luck with your TestFlight submission! 🚀



