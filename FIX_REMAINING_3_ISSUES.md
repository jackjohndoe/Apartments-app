# Fix Remaining 3 Issues for App Store Submission

You have **3 remaining issues** to fix:

## Issue 1: Select Primary Category ⚠️

**Error**: "You must select a primary category for your app."

**Location**: App Information section (may require admin access)

**Steps**:
1. Navigate to: **Distribution** → **General** → **App Information**
   OR: **Distribution** → **iOS App** → **1.0 Prepare for Submission** → Look for "App Store Information" section
2. Find **"Primary Category"** dropdown field (might be under "App Store Information" or "General App Information")
3. Click the dropdown and select: **Travel** or **Lifestyle** (best for apartment/rental app)
4. If you don't see it there, try:
   - Check if there's an **"Edit"** button next to "App Store Information"
   - Look for **"App Store Information"** section on the "Prepare for Submission" page
   - The category might be editable from a link in the error message

**Alternative Method**:
- In App Store Connect, the primary category is sometimes set when you first create the App Store version
- If this is your first submission, you might need to go through the initial App Store listing setup
- Try clicking on the error message link - it may take you directly to where you can set the category

## Issue 2: Complete App Privacy Usage Purposes ⚠️

**Error**: "Before you can submit this app for review, an Admin must provide information about the app's privacy practices in the App Privacy section."

**Status**: ✅ Data types selected (Name, Email, Phone, Payment, Photos)
**Missing**: Usage purposes configuration for each data type

**Location**: App Privacy section

**Steps**:
1. Navigate to: **App Store** → **Trust & Safety** → **App Privacy**
   Direct URL: https://appstoreconnect.apple.com/apps/6756714869/distribution/privacy
2. You should see 5 data type cards: Name, Email Address, Phone Number, Payment Info, Photos or Video
3. **Click on each data type card** (or click the "More information" button on each)
4. For **each** data type, specify:
   - **Usage Purpose**: Select "App Functionality" (required)
   - **Linked to User Identity**: Yes (for account/authentication)
   - **Used for Tracking**: **NO** (since we removed tracking permission)
5. Click **Save** for each data type
6. After configuring all 5 data types, click **"Publish"** button at the top of the App Privacy page (if available)
7. **Important**: The "Publish" button might be disabled until all data types are configured

**Note**: Some data types might need additional configuration. Make sure to complete the questionnaire for each one.

## Issue 3: Fix Tracking Disclosure ⚠️

**Error**: "Your app contains NSUserTrackingUsageDescription, indicating that it may request permission to track users. To submit for review, update your App Privacy response to indicate that data collected from this app will be used for tracking purposes, or update your app binary and upload a new build."

**Current Status**: 
- ✅ `NSUserTrackingUsageDescription` removed from `app.json` (line 23)
- ❌ Current build (1.0.0 (12)) still has the tracking permission

**Two Options**:

### Option A: Rebuild App (RECOMMENDED - Clean Solution) ✅

Since we've already removed the tracking permission from code, rebuild the app:

**Steps**:
1. **Commit and push changes** (if not already done):
   ```bash
   git add app.json
   git commit -m "Remove NSUserTrackingUsageDescription - app does not use tracking"
   git push origin main-clean
   ```

2. **Build new version via EAS Web Interface**:
   - Go to: https://expo.dev/accounts/[your-account]/projects/[your-project]/builds
   - Click **"New Build"** → **iOS** → **Production**
   - Wait for build to complete (~15-30 minutes)
   - Build number will automatically increment to 1.0.0 (13)

3. **Upload new build to App Store Connect**:
   - After build completes, it should automatically be uploaded to TestFlight
   - OR manually submit via EAS: `eas submit --platform ios --latest`
   - OR use EAS web interface to submit

4. **Select new build in App Store Connect**:
   - Go to: **Distribution** → **iOS App** → **1.0 Prepare for Submission**
   - Click **"Add Build"** button (if needed)
   - Select the new build (1.0.0 (13)) from TestFlight
   - Save changes

### Option B: Declare Tracking in App Privacy (QUICK - For Current Build)

If you want to submit immediately with current build (1.0.0 (12)):

**Steps**:
1. Navigate to: **App Store** → **Trust & Safety** → **App Privacy**
2. When configuring data types (Issue 2), for each data type:
   - **Used for Tracking**: Select **YES**
   - Specify which data is used for tracking
3. Complete the tracking disclosure questionnaire
4. Publish App Privacy information

**Note**: This is less ideal since your app doesn't actually use tracking, but it will allow you to submit immediately with the current build.

## Recommended Approach

**Best Solution**: Complete Option A (Rebuild) + Fix Issues 1 & 2
- This gives you a clean build without tracking permission
- Matches your actual app functionality
- Prevents future issues

**Quick Solution**: Complete Option B + Fix Issues 1 & 2
- Allows immediate submission with current build
- Less ideal since app doesn't use tracking
- You'll need to rebuild later anyway

## Action Items Checklist

- [ ] **Issue 1**: Select Primary Category (Travel or Lifestyle)
- [ ] **Issue 2**: Configure App Privacy usage purposes for all 5 data types
- [ ] **Issue 2**: Publish App Privacy information
- [ ] **Issue 3**: Choose Option A (Rebuild) OR Option B (Declare Tracking)
- [ ] **Issue 3**: If Option A: Commit changes, rebuild via EAS, upload new build, select new build
- [ ] **Issue 3**: If Option B: Configure tracking disclosure in App Privacy
- [ ] Verify "Add for Review" button is enabled
- [ ] Submit app for review

## After Fixing All Issues

Once all 3 issues are resolved:
1. Navigate to: **Distribution** → **iOS App** → **1.0 Prepare for Submission**
2. Verify all required items are checked off
3. Ensure "Add for Review" button is enabled
4. Complete any remaining listing details (Description, Subtitle, Screenshots - you've already done this)
5. Select the correct build (new build if you chose Option A)
6. Click **"Add for Review"** to submit

## Need Help?

If you encounter issues:
- **Primary Category**: The field might be hidden or require admin access. Try clicking the error message link.
- **App Privacy**: Make sure you click on each data type card and complete the questionnaire fully.
- **Rebuild**: If EAS build fails, check build logs and ensure all dependencies are correct.






