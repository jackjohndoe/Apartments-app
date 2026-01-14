# Next Steps: App Store Submission

## ✅ Current Status
- **Build Complete:** iOS App Store build 1.0.0 (12) ✅
- **Status:** Ready for submission
- **Build Type:** Production (App Store distribution)

## 🚀 Step 1: Submit Build to App Store Connect

### Option A: Using EAS Submit (Recommended - Easiest)

Run this command in your terminal:

```bash
eas submit --platform ios --latest
```

**What happens:**
1. EAS will automatically find your latest production build (1.0.0 (12))
2. Prompts for Apple Developer account credentials
3. Uploads the `.ipa` file to App Store Connect
4. Build appears in App Store Connect → TestFlight → Builds
5. Processing takes 10-30 minutes

**You'll need:**
- Apple Developer account email
- Apple Developer account password
- 2FA code (if enabled on your Apple Developer account)

**Or use App Store Connect API Key:**
If you have an App Store Connect API key set up, EAS will use that instead of prompting for credentials.

### Option B: Manual Upload

1. Download the `.ipa` from EAS dashboard:
   - Go to https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds
   - Click on build 1.0.0 (12)
   - Download the `.ipa` file

2. Upload using Transporter (Mac only):
   - Download Transporter from Mac App Store
   - Open Transporter
   - Drag and drop the `.ipa` file
   - Click "Deliver"

3. Or use Xcode:
   - Open Xcode → Window → Organizer
   - Click "Distribute App"
   - Select the `.ipa` file
   - Follow the wizard

## 📱 Step 2: Set Up App in App Store Connect (If Not Done)

1. **Go to App Store Connect:**
   - Visit https://appstoreconnect.apple.com
   - Sign in with your Apple Developer account

2. **Create New App:**
   - Click **My Apps** → **+** → **New App**
   - Fill in:
     - **Platform:** iOS
     - **Name:** Apartify Africa
     - **Primary Language:** English
     - **Bundle ID:** `com.nigerianapartments.app` (must match exactly)
     - **SKU:** `apartify-africa-001` (unique identifier)
     - **User Access:** Full Access
   - Click **Create**

3. **Complete App Information:**
   - Go to **App Information** tab
   - Set **Category:** Travel or Lifestyle
   - Add **Privacy Policy URL:** (REQUIRED - must be publicly accessible)
   - Add **Support URL:** Your support page or email
   - Add **Marketing URL:** (optional) Your website
   - Click **Save**

4. **Pricing and Availability:**
   - Go to **Pricing and Availability**
   - Set as **Free** (or choose paid)
   - Select countries/regions
   - Click **Save**

5. **App Privacy:**
   - Go to **App Privacy**
   - Answer privacy questionnaire:
     - **Data Collection:** Yes
     - **Data Types:** User account data, Payment information, Photos
     - **Data Usage:** App functionality, payment processing
     - **Third-party sharing:** Yes (Flutterwave for payments)
   - Click **Save**

## 🖼️ Step 3: Complete App Store Listing (REQUIRED)

### Screenshots (MANDATORY)
You need minimum 3 screenshots per device size:

**iPhone 6.7" (iPhone 14 Pro Max):**
- Size: 1290 x 2796 pixels
- Minimum: 3 screenshots
- Maximum: 10 screenshots

**iPhone 6.5" (iPhone 11 Pro Max):**
- Size: 1242 x 2688 pixels
- Minimum: 3 screenshots
- Maximum: 10 screenshots

**How to Create Screenshots:**
1. Run app on iPhone simulator or device
2. Navigate to key screens:
   - Home/Explore screen with listings
   - Apartment details page
   - Booking flow
   - Profile/Wallet screen
3. Take screenshots:
   - **Device:** Power + Volume Up buttons
   - **Simulator:** Device → Screenshot or Cmd + S
4. Resize to exact dimensions using image editor
5. Upload to App Store Connect → App Store → Screenshots

### App Description

1. **Subtitle** (30 characters max):
   ```
   Find Your Perfect Apartment
   ```

2. **Description** (4000 characters max):
   ```
   Apartify Africa - Your trusted platform for finding and booking apartments across Nigeria.

   Looking for the perfect place to call home? Apartify Africa makes it easy to discover, compare, and book apartments that match your lifestyle and budget.

   KEY FEATURES:
   • Browse thousands of verified apartment listings
   • Filter by location, price, amenities, and more
   • Secure in-app booking and payment system
   • Virtual account generation for easy bank transfers
   • Save favorite listings for later
   • Real-time availability updates
   • Detailed apartment information and photos
   • Secure wallet for managing your bookings

   Whether you're relocating, looking for a short-term rental, or searching for your dream home, Apartify Africa connects you with quality apartments throughout Nigeria.

   Download now and find your perfect apartment today!
   ```

3. **Keywords** (100 characters max):
   ```
   apartments, rental, Nigeria, booking, accommodation, housing, property, rent
   ```

4. **Promotional Text** (170 characters, optional - can be updated without resubmission):
   ```
   Discover amazing apartments across Nigeria. Easy booking, secure payments, trusted listings.
   ```

### Version Information

1. **What's New in This Version** (v1.0.0):
   ```
   Welcome to Apartify Africa!

   • Browse apartment listings across Nigeria
   • Secure booking and payment system
   • Virtual account generation for bank transfers
   • Save and manage your favorite listings
   • Real-time availability updates
   ```

2. **Copyright:** Your name or company name

3. **Trade Representative Contact:** Your contact information

## ✅ Step 4: Submit for Review

Once your build has been processed (10-30 minutes after upload):

1. **In App Store Connect:**
   - Go to your app → **App Store** tab
   - Select the processed build (1.0.0 (12))
   - Complete all required sections (all should have green checkmarks)

2. **Verify All Required Sections:**
   - ✅ App Information
   - ✅ Pricing and Availability
   - ✅ App Privacy
   - ✅ App Store Listing (screenshots, description)
   - ✅ Build selected

3. **Submit for Review:**
   - Click **Add for Review** or **Submit for Review**
   - Answer export compliance questions:
     - **Does your app use encryption?** No (already set in app.json)
     - **Content rights:** Confirm you have rights
     - **Advertising identifier:** Specify if using
   - Click **Submit**

## ⏱️ Step 5: Wait for Review

**Review Timeline:**
- **Typical:** 24-48 hours
- **First submission:** Can take up to 7 days
- **Expedited review:** Available in urgent cases (limited availability)

**Monitor Status:**
- Check App Store Connect regularly
- Email notifications sent for status changes
- Status will show: "Waiting for Review" → "In Review" → "Pending Developer Release" or "Ready for Sale"

**Common Review Issues:**
- Missing privacy policy URL (REQUIRED)
- Insufficient screenshots
- App crashes or bugs
- Missing app description
- Privacy information incomplete

## 🎯 Quick Command Reference

```bash
# Submit latest build to App Store Connect
eas submit --platform ios --latest

# Check submission status
eas submit:list

# Check build status
eas build:list

# View specific build details
eas build:view [BUILD_ID]
```

## 📋 Checklist Before Submitting

- [ ] Build submitted to App Store Connect
- [ ] App created in App Store Connect
- [ ] Bundle ID matches: `com.nigerianapartments.app`
- [ ] Privacy Policy URL added (publicly accessible)
- [ ] Support URL added
- [ ] Screenshots uploaded (minimum 3 per device size)
- [ ] App description completed
- [ ] Keywords added
- [ ] App Privacy questionnaire completed
- [ ] Pricing set
- [ ] Build processed and ready
- [ ] All sections show green checkmarks
- [ ] Ready to submit for review

## 🆘 Need Help?

- **EAS Submit Docs:** https://docs.expo.dev/submit/introduction/
- **App Store Connect Help:** https://help.apple.com/app-store-connect/
- **App Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/

## 🚀 Ready to Start?

Run this command now to submit your build:

```bash
eas submit --platform ios --latest
```

Good luck with your submission! 🎉







