# App Store Submission Guide - Nigerian Apartments

Complete step-by-step guide to submit your app to the iOS App Store.

## Prerequisites Checklist

- [x] Apple Developer account (active)
- [x] EAS configured
- [x] Bundle ID: `com.nigerianapartments.app`
- [ ] App icon (1024x1024px) - **ACTION REQUIRED**
- [ ] App screenshots - **ACTION REQUIRED**
- [ ] Privacy policy URL - **ACTION REQUIRED**

## Step 1: Prepare App Icon

**Required:** 1024x1024px PNG file (no transparency)

1. Create or obtain your app icon
2. Save as `assets/icon.png`
3. Requirements:
   - Size: Exactly 1024x1024 pixels
   - Format: PNG
   - No transparency (solid background)
   - Design: Should represent "Nigerian Apartments" with gold (#FFD700) theme

**Note:** The icon is already referenced in `app.json`. Just place the file at `assets/icon.png`.

## Step 2: Prepare App Screenshots

**Required for App Store submission**

### iPhone Screenshots Needed:

**iPhone 6.7" (iPhone 14 Pro Max):**
- Size: 1290x2796px
- Quantity: Minimum 3, maximum 10
- Recommended: 5-7 screenshots

**iPhone 6.5" (iPhone 11 Pro Max):**
- Size: 1242x2688px
- Quantity: Minimum 3, maximum 10
- Recommended: 5-7 screenshots

**iPad Pro 12.9" (if supporting iPad):**
- Size: 2048x2732px
- Quantity: Minimum 3, maximum 10

### Screenshot Content Suggestions:

1. **Home/Explore Screen** - Show apartment listings
2. **Apartment Details** - Show property details with images
3. **Booking Flow** - Show date selection and booking process
4. **Wallet/Payment** - Show wallet balance and payment options
5. **Profile Screen** - Show user profile and settings
6. **Search/Filter** - Show search functionality
7. **Favorites** - Show saved apartments

### How to Capture Screenshots:

1. Run app on device or simulator
2. Use device screenshot (Power + Volume Up on iPhone)
3. Or use simulator: Device → Screenshot
4. Edit screenshots to remove status bar if needed
5. Resize to exact dimensions required

## Step 3: Build Production App

### 3.1 Login to EAS

```bash
eas login
```

Enter your Expo account credentials. If you don't have an account, create one at https://expo.dev/signup

Verify login:
```bash
eas whoami
```

### 3.2 Configure Credentials

```bash
eas credentials
```

Follow prompts:
1. Select **iOS** platform
2. Select **Set up new credentials** or **Manage existing**
3. Choose **Let EAS handle credentials** (recommended)
4. Provide Apple Developer account credentials when prompted

EAS will automatically:
- Create distribution certificates
- Generate provisioning profiles
- Manage all credentials

### 3.3 Build Production App

```bash
eas build --platform ios --profile production
```

**What happens:**
- EAS uploads your project to cloud
- Builds iOS app (takes 15-30 minutes)
- You'll receive email when complete
- Build URL provided for tracking

**Monitor build:**
```bash
eas build:list
```

Or check the build URL provided in terminal.

## Step 4: App Store Connect Setup

### 4.1 Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform:** iOS
   - **Name:** Apartify Africa
   - **Primary Language:** English
   - **Bundle ID:** `com.nigerianapartments.app`
   - **SKU:** `apartify-africa-001` (any unique identifier)
   - **User Access:** Full Access
4. Click **Create**

### 4.2 Complete App Information

**App Information Tab:**
- **Category:** Select **Travel** or **Lifestyle**
- **Privacy Policy URL:** ⚠️ **REQUIRED** - Must be publicly accessible
  - Example: `https://yourwebsite.com/privacy-policy`
  - If you don't have one, create a simple privacy policy page
- **Support URL:** Your support page or email
- **Marketing URL (optional):** Your website

**Pricing and Availability:**
- Set as **Free** or **Paid**
- Select countries/regions (default: All countries)
- Click **Save**

**App Privacy:**
1. Click **Get Started** or **Edit** in App Privacy section
2. Complete privacy questionnaire:
   - **Data Collection:** Yes (you collect user data)
   - **Types of Data:**
     - User account data (email, name)
     - Payment information (via Flutterwave)
     - Photos (for profile and listings)
   - **Data Usage:** 
     - App functionality
     - Payment processing
     - User authentication
   - **Data Sharing:** Specify if shared with third parties (Flutterwave)
3. Click **Save**

## Step 5: Prepare App Store Listing

### 5.1 App Description Template

**Subtitle (30 characters max):**
```
Find Your Perfect Apartment
```

**Description (4000 characters max):**
```
Apartify Africa - Your Gateway to Premium Apartment Rentals in Nigeria

Discover and book the perfect apartment for your stay in Nigeria. Apartify Africa connects travelers and locals with verified, high-quality apartment listings across major Nigerian cities.

KEY FEATURES:
🏠 Extensive Listings - Browse hundreds of verified apartments in Lagos, Abuja, Port Harcourt, and more
📸 Real Photos - View detailed property photos and amenities
💰 Secure Payments - Safe and secure payment processing via Flutterwave
💳 Digital Wallet - Manage your payments with our integrated wallet system
📅 Easy Booking - Simple booking process with flexible dates
⭐ Favorites - Save your favorite listings for quick access
👤 Host Dashboard - List and manage your properties easily
🔔 Notifications - Stay updated on bookings and payments

PERFECT FOR:
• Business travelers seeking comfortable accommodations
• Tourists exploring Nigeria
• Locals looking for short-term rentals
• Property owners wanting to list their spaces

WHY CHOOSE APARTIFY AFRICA:
✓ Verified listings with real photos
✓ Secure payment processing
✓ 24/7 customer support
✓ Easy-to-use interface
✓ Competitive pricing
✓ Trusted by thousands of users

Download Apartify Africa today and experience the best in Nigerian apartment rentals!
```

**Keywords (100 characters max):**
```
apartments, rental, Nigeria, booking, accommodation, Lagos, Abuja, travel, property, housing
```

**Promotional Text (170 characters max, optional):**
```
New users get special deals! Book your perfect apartment today with secure payments and verified listings across Nigeria.
```

### 5.2 Support Information

**Support URL:**
- Your support page URL or email: `mailto:support@apartifyafrica.com`

**Marketing URL (optional):**
- Your website: `https://apartifyafrica.com`

### 5.3 Version Information

**What's New in This Version (v1.0.0):**
```
Welcome to Apartify Africa!

🎉 Initial Release Features:
• Browse and search apartments across Nigeria
• Secure booking and payment system
• Digital wallet integration
• User profiles and favorites
• Host dashboard for property management
• Real-time notifications
• Beautiful, intuitive interface

Start exploring amazing apartments today!
```

**Copyright:**
```
© 2024 Apartify Africa
```

**Trade Representative Contact:**
- Your contact information

## Step 6: Submit Build to App Store Connect

### 6.1 Using EAS Submit (Recommended)

**First, set up App Store Connect API Key:**

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** → **Keys** tab
3. Click **+** to create new key
4. Fill in:
   - **Name:** EAS Build Key
   - **Access:** App Manager or Admin
5. Click **Generate**
6. **IMPORTANT:** Download the `.p8` key file immediately
7. Note **Key ID** and **Issuer ID**

**Add to EAS:**
```bash
eas credentials
```

1. Select **iOS**
2. Select **App Store Connect API Key**
3. Enter Key ID, Issuer ID, and key file path

**Submit build:**
```bash
eas submit --platform ios --latest
```

EAS will automatically:
- Upload latest build to App Store Connect
- Submit to TestFlight first
- Build appears in App Store Connect within 10-30 minutes

### 6.2 Manual Upload (Alternative)

1. Download `.ipa` file from EAS build page
2. Use **Transporter** app (Mac App Store) or Xcode
3. Upload to App Store Connect
4. Wait for processing (10-30 minutes)

## Step 7: Complete App Store Submission

### 7.1 Upload Screenshots and Assets

1. Go to App Store Connect → Your App → **App Store** tab
2. Select version (1.0.0)
3. Upload screenshots for each device size:
   - iPhone 6.7"
   - iPhone 6.5"
   - iPad Pro 12.9" (if supporting)
4. Upload app icon (1024x1024px)
5. Add app preview video (optional)

### 7.2 Complete App Store Listing

1. **App Information:**
   - Subtitle: Enter from template above
   - Description: Enter from template above
   - Keywords: Enter from template above
   - Support URL: Enter your support URL
   - Marketing URL: Enter your website (optional)
   - Promotional Text: Enter from template (optional)

2. **Version Information:**
   - What's New: Enter from template above
   - Copyright: Enter your copyright
   - Trade Representative: Enter contact info

3. **App Review Information:**
   - Contact Information: Your email/phone
   - Demo Account (if app requires login):
     - Username: `demo@apartifyafrica.com`
     - Password: `Demo123!`
   - Notes: "This is a rental booking app. Demo account provided for testing."

### 7.3 Select Build

1. In App Store tab, scroll to **Build** section
2. Click **+** next to Build
3. Select the processed build (status: "Ready to Submit")
4. Click **Done**

### 7.4 Submit for Review

1. Ensure all required sections are complete (green checkmarks)
2. Click **Add for Review** or **Submit for Review**
3. Answer export compliance questions:
   - **Encryption:** No (already set in app.json)
   - **Content Rights:** Confirm you have rights
   - **Advertising Identifier:** If using, specify usage
4. Click **Submit**

## Step 8: Review Process

### Timeline

- **Initial Review:** 24-48 hours typically
- **First Submission:** Can take up to 7 days
- **Updates:** Usually faster (24-48 hours)

### Monitor Status

1. Check App Store Connect regularly
2. Email notifications sent for status changes
3. Status appears in App Store Connect dashboard

### If Rejected

1. **Review rejection reasons** in App Store Connect
2. **Fix all issues** mentioned
3. **Create new build:**
   ```bash
   eas build --platform ios --profile production
   ```
4. **Resubmit** with updated build

### If Approved

1. App goes live automatically (if "Automatically release this version" enabled)
2. Or manually release from App Store Connect
3. App appears in App Store within 24 hours

## Quick Command Reference

```bash
# Login to EAS
eas login

# Configure credentials
eas credentials

# Build production app
eas build --platform ios --profile production

# Check build status
eas build:list

# View build details
eas build:view [BUILD_ID]

# Submit to App Store
eas submit --platform ios --latest

# Check submission status
eas submit:list
```

## Troubleshooting

### Build Fails
- Check build logs: `eas build:view [BUILD_ID]`
- Verify credentials: `eas credentials`
- Check for code signing issues

### Submission Fails
- Verify App Store Connect API key permissions
- Ensure app exists in App Store Connect
- Check bundle ID matches exactly: `com.nigerianapartments.app`

### Review Rejected
- Read rejection reasons carefully
- Address all issues mentioned
- Resubmit with fixes

## Important Notes

1. **Privacy Policy URL is mandatory** - Must be publicly accessible
2. **Screenshots are required** - Cannot submit without them
3. **First submission takes longer** - Be patient
4. **Build number auto-increments** - Configured in eas.json
5. **Version number** - Increment manually in app.json for updates

## Next Steps After Approval

1. Monitor app performance in App Store Connect
2. Respond to user reviews
3. Plan updates and new features
4. Market your app launch

Good luck with your submission! 🚀


