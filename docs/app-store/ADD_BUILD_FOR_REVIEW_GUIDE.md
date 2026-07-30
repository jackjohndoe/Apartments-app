# Add Build for App Store Review - Step by Step Guide

## Current Status
- **Latest Build**: 1.0.0 (22) - Finished ✅
- **App Bundle ID**: `com.nigerianapartments.app`
- **App Name**: Apartify Africa
- **Version**: 1.0.0

## Step 1: Verify Build Upload Status

1. **Log in to App Store Connect**
   - Go to: https://appstoreconnect.apple.com
   - Sign in with your Apple Developer account

2. **Navigate to Your App**
   - Click **"My Apps"** in the top navigation
   - Find and click on **"Apartify Africa"** (or your app name)
   - If you don't see your app, you may need to create it first

3. **Check TestFlight Tab**
   - Click on **"TestFlight"** tab in the left sidebar
   - Look for build **1.0.0 (22)** in the list
   - If you see it, it's been uploaded ✅
   - If you don't see it, wait a few more minutes or check the submission status

## Step 2: Navigate to Prepare for Submission

1. **Go to App Store Tab**
   - Click on **"App Store"** tab in the left sidebar
   - This is where you manage your app listing and submissions

2. **Select Version**
   - If this is your first submission, you'll see **"1.0 Prepare for Submission"**
   - If you've submitted before, you may see **"1.0 Ready for Sale"** or **"In Review"**
   - Click on the version you want to submit

## Step 3: Select Build

1. **Find Build Section**
   - Scroll down to the **"Build"** section
   - You'll see a dropdown or **"Select a build before you submit your app"** message

2. **Select Build 1.0.0 (22)**
   - Click the **"+"** button or **"Select a build"** link
   - A modal will appear showing available builds
   - Select **"1.0.0 (22)"** from the list
   - Click **"Done"** or **"Select"**

## Step 4: Complete Required Information

Before you can submit, you must complete these required sections:

### A. App Information
- **Primary Category**: Select **"Travel"** or **"Lifestyle"** (recommended: Travel)
- **Secondary Category** (optional): Can leave blank or select another relevant category

### B. App Privacy (Admin Required)
- Navigate to **App Store → Trust & Safety → App Privacy**
- Complete the privacy questionnaire:
  - **User Account Data**: Yes (Email, Name)
  - **Photos**: Yes (Profile pictures, listings)
  - **Financial Information**: Yes (Payment processing)
  - **Location Data**: Possibly (if app uses location)
- Specify how data is used and if it's shared

### C. Pricing and Availability
- **Price**: Select **"Free"** (or choose a paid tier)
- **Availability**: Select countries (default: All countries)

### D. Age Rating
- Navigate to **App Store → Trust & Safety → Ratings and Review**
- Complete the content description questionnaire:
  - Most categories: **None** (for an apartment booking app)
  - **Unrestricted Web Access**: Possibly (if using WebView)
- App should receive **4+** or **12+** rating

## Step 5: Complete App Listing Details

Fill in the required fields in the "App Information" section:

1. **Name**: Apartify Africa (or your app name)
2. **Subtitle**: Brief description (e.g., "Find Your Perfect Apartment in Nigeria")
3. **Description**: Full app description
4. **Keywords**: Search keywords (comma-separated)
5. **Support URL**: Your support website
6. **Marketing URL** (optional): Your marketing website
7. **Privacy Policy URL**: Required if collecting user data

## Step 6: Add Screenshots

1. **App Screenshots**
   - Upload screenshots for required device sizes:
     - iPhone 6.7" Display (iPhone 14 Pro Max, etc.)
     - iPhone 6.5" Display (iPhone 11 Pro Max, etc.)
   - Minimum: 1 screenshot per size
   - Recommended: 3-10 screenshots per size

2. **App Preview** (optional but recommended)
   - Upload video previews showing app functionality

## Step 7: Review Information

1. **Contact Information**
   - **First Name**: Your first name
   - **Last Name**: Your last name
   - **Phone Number**: Your contact number
   - **Email**: Your email address

2. **Demo Account** (if app requires login)
   - **Username**: Test account username
   - **Password**: Test account password
   - **Notes**: Any additional information for reviewers

## Step 8: Submit for Review

1. **Review All Sections**
   - Scroll through all sections and verify:
     - ✅ Build selected (1.0.0 (22))
     - ✅ All required fields completed
     - ✅ Screenshots uploaded
     - ✅ Privacy information complete
     - ✅ Age rating complete
     - ✅ Pricing selected

2. **Check for Warnings**
   - Look for any yellow warning icons
   - Address any missing required information

3. **Submit**
   - Once all requirements are met, the **"Add for Review"** button will be enabled
   - Click **"Add for Review"**
   - Confirm submission
   - Your app will now be in **"Waiting for Review"** status

## Step 9: Monitor Review Status

After submission:
1. **Status Updates**
   - You'll receive email notifications about status changes
   - Check App Store Connect for updates

2. **Possible Statuses**:
   - **Waiting for Review**: App is in queue
   - **In Review**: Apple is reviewing your app
   - **Pending Developer Release**: Approved, waiting for you to release
   - **Ready for Sale**: App is live on App Store
   - **Rejected**: Review failed (you'll get feedback)

## Troubleshooting

### Build Not Showing in App Store Connect
- **Wait**: It can take 5-30 minutes after EAS submission
- **Check EAS Dashboard**: Verify submission status at expo.dev
- **Check TestFlight**: Builds appear in TestFlight first

### "Add for Review" Button Disabled
- Check for incomplete required sections (marked with ⚠️)
- Ensure build is selected
- Complete all required fields in App Information
- Complete App Privacy questionnaire (Admin required)

### Missing Required Information
- **App Privacy**: Requires Admin role to complete
- **Age Rating**: Complete the questionnaire
- **Screenshots**: Upload at least 1 per required device size
- **Description**: Write a detailed app description

## Quick Checklist

Before clicking "Add for Review", verify:
- [ ] Build 1.0.0 (22) is selected
- [ ] Primary category is selected
- [ ] App Privacy information is complete (Admin)
- [ ] Age Rating questionnaire is complete
- [ ] Price tier is selected
- [ ] App name, subtitle, and description are filled
- [ ] Screenshots are uploaded (minimum 1 per device size)
- [ ] Support URL is provided
- [ ] Privacy Policy URL is provided (if collecting data)
- [ ] Contact information is complete
- [ ] No warnings or errors shown

## Need Help?

- **App Store Connect Help**: https://help.apple.com/app-store-connect/
- **EAS Submission Status**: https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/submissions
- **Build Status**: https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds







