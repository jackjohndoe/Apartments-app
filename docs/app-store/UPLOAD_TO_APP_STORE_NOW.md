# Upload to App Store - Step by Step

## Current Status
- ✅ EAS logged in: michaelkaysea
- ✅ Bundle ID configured: com.nigerianapartments.app
- ✅ Production profile ready
- ⚠️ App icon missing (will need before final submission)

## Step 1: Configure iOS Credentials

Run this command in your terminal:
```bash
eas credentials
```

When prompted:
1. Select **iOS**
2. Select **Set up new credentials** (or **Manage existing** if you've done this before)
3. Choose **Let EAS handle credentials** (recommended - easiest option)
4. Enter your Apple Developer account credentials when prompted:
   - Apple ID email
   - Password
   - 2FA code (if enabled)

EAS will automatically:
- Create distribution certificates
- Generate provisioning profiles
- Manage all credentials securely

## Step 2: Build Production App

After credentials are configured, run:
```bash
eas build --platform ios --profile production
```

**This will:**
- Build your app for App Store distribution
- Take 15-30 minutes
- Send you an email when complete
- Generate a build you can submit to App Store Connect

**Monitor progress:**
```bash
eas build:list
```

## Step 3: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Click **My Apps** → **+** → **New App**
4. Fill in:
   - **Platform:** iOS
   - **Name:** Apartify Africa
   - **Primary Language:** English
   - **Bundle ID:** Select `com.nigerianapartments.app` (must match exactly)
   - **SKU:** `apartify-africa-001` (unique identifier, can be anything)
   - **User Access:** Full Access
5. Click **Create**

## Step 4: Complete App Information

In App Store Connect, go to your app → **App Information**:

1. **Category:**
   - Primary: Travel or Lifestyle
   - Secondary: (optional)

2. **Privacy Policy URL:** 
   - **REQUIRED** - Must be publicly accessible
   - Example: `https://yourwebsite.com/privacy-policy`
   - Create a simple privacy policy page if you don't have one

3. **Support URL:**
   - Your support page or email
   - Example: `https://yourwebsite.com/support` or `mailto:support@yourapp.com`

4. **Marketing URL:** (optional)
   - Your website or landing page

5. Click **Save**

## Step 5: Pricing and Availability

1. Go to **Pricing and Availability**
2. Set price: **Free** (or choose paid)
3. Select countries/regions (default: All countries)
4. Click **Save**

## Step 6: App Privacy

1. Go to **App Privacy**
2. Click **Get Started** or **Edit**
3. Answer the privacy questionnaire:
   - **Data Collection:** Yes (you collect user data)
   - **Data Types Collected:**
     - User account data (email, name)
     - Payment information (via Flutterwave)
     - Photos (for profile and listings)
   - **Data Usage:** App functionality, payment processing
   - **Data Sharing:** Yes (with Flutterwave for payments)
   - **Flutterwave:** Third-party payment processor
4. Click **Save**

## Step 7: Submit Build to App Store Connect

Once your build is complete (from Step 2):

```bash
eas submit --platform ios --latest
```

**Or manually:**
1. Download the `.ipa` file from EAS dashboard
2. Use Transporter app (Mac) or Xcode to upload
3. Go to App Store Connect → Your App → TestFlight → Builds
4. Wait for processing (10-30 minutes)

## Step 8: Complete App Store Listing

Go to **App Store** tab in App Store Connect:

### Screenshots (REQUIRED)
- **iPhone 6.7"** (1290x2796px): Minimum 3, maximum 10
- **iPhone 6.5"** (1242x2688px): Minimum 3, maximum 10
- **iPad Pro 12.9"** (2048x2732px): Minimum 3, maximum 10 (if supporting iPad)

**How to get screenshots:**
1. Run app on iPhone simulator or device
2. Take screenshots (Power + Volume Up on device)
3. Or use simulator: Device → Screenshot
4. Resize to exact dimensions

### App Description
- **Subtitle** (30 characters max): Brief tagline
- **Description** (4000 characters max): See APP_STORE_LISTING_CONTENT.md
- **Keywords** (100 characters max): apartments, rental, Nigeria, booking, accommodation
- **Promotional Text** (170 characters, optional): Can be updated without resubmission

### Version Information
- **What's New:** Release notes for v1.0.0
- **Copyright:** Your name/company
- **Trade Representative Contact:** Your contact info

## Step 9: Submit for Review

1. In **App Store** tab, select the processed build
2. Complete all required sections (green checkmarks)
3. Click **Add for Review** or **Submit for Review**
4. Answer export compliance questions:
   - **Encryption:** No (already set in app.json)
   - **Content rights:** Confirm you have rights
   - **Advertising identifier:** Specify if using
5. Click **Submit**

## Step 10: Wait for Review

- **Timeline:** 24-48 hours typically
- **First submission:** Can take up to 7 days
- **Monitor:** Check App Store Connect regularly
- **Email notifications:** Sent for status changes

## Important Notes

### App Icon (CRITICAL)
⚠️ **You need to create a 1024x1024px app icon before final submission**

1. Create or design your app icon
2. Save as `assets/icon.png`
3. Requirements:
   - Exactly 1024x1024 pixels
   - PNG format
   - No transparency (solid background)
   - Should represent "Apartify Africa" with gold (#FFD700) theme

### Privacy Policy (REQUIRED)
You must have a publicly accessible privacy policy URL. Options:
1. Create a simple HTML page
2. Host on GitHub Pages, Netlify, or your website
3. Include basic privacy information

### Screenshots (REQUIRED)
Minimum 3 screenshots per device size are required. You can:
1. Use iPhone simulator to capture screenshots
2. Resize to exact dimensions
3. Upload to App Store Connect

## Quick Commands Reference

```bash
# Check EAS login
eas whoami

# Configure credentials
eas credentials

# Build production app
eas build --platform ios --profile production

# Check build status
eas build:list

# Submit to App Store
eas submit --platform ios --latest

# Check submission status
eas submit:list
```

## Need Help?

- EAS Documentation: https://docs.expo.dev/build/introduction/
- App Store Connect Help: https://help.apple.com/app-store-connect/
- See APP_STORE_SUBMISSION_GUIDE.md for detailed instructions

## Next Steps Right Now

1. **Run:** `eas credentials` (configure iOS credentials)
2. **Run:** `eas build --platform ios --profile production` (start build)
3. **While building:** Set up App Store Connect app
4. **After build:** Submit with `eas submit --platform ios --latest`
5. **Complete listing:** Add screenshots and description
6. **Submit for review**

Good luck! 🚀














