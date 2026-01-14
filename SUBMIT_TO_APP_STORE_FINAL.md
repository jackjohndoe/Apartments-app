# Complete Guide: Submit App to App Store for Review

## Current Status

✅ **Build 1.0.0 (12)**: Successfully uploaded to TestFlight  
✅ **App Privacy Data Types**: Selected (Name, Email, Phone, Payment, Photos)  
✅ **NSUserTrackingUsageDescription**: Removed from `app.json`  
⚠️ **"Add for Review" Button**: Currently showing "Processing" but disabled (requirements not met)

## ⚠️ 3 Issues Preventing Submission

### Issue 1: Primary Category Not Selected

**Location**: App Information section  
**Steps**:
1. Navigate to: **Distribution** → **General** → **App Information**
   - Direct URL: https://appstoreconnect.apple.com/apps/6756714869/distribution/info
2. Find **"Primary Category"** dropdown (may be under "App Store Information" or "General App Information")
3. Click the dropdown and select: **Travel** or **Lifestyle** (best for apartment/rental app)
4. If you don't see it:
   - Look for **"Edit"** button next to "App Store Information" section
   - The category might be on the "Prepare for Submission" page itself
   - Try clicking the error message link - it may navigate directly to the field
5. Click **Save**

**Note**: This field might require Admin access or might be set during the initial App Store listing setup.

---

### Issue 2: App Privacy Usage Purposes Not Configured

**Status**: ✅ Data types selected (Name, Email, Phone, Payment, Photos)  
**Missing**: Usage purposes configuration for each data type

**Location**: App Privacy section  
**Steps**:
1. Navigate to: **App Store** → **Trust & Safety** → **App Privacy**
   - Direct URL: https://appstoreconnect.apple.com/apps/6756714869/distribution/privacy
2. You should see 5 data type cards: Name, Email Address, Phone Number, Payment Info, Photos or Video
3. **For EACH data type**, click on the data type card (or click the "More information" button)
4. Configure each data type:
   - **Usage Purpose**: Select **"App Functionality"** (required for all)
   - **Linked to User Identity**: Select **"Yes"** (for account/authentication)
   - **Used for Tracking**: Select **"No"** (since we removed tracking permission)
5. Click **Save** for each data type
6. After configuring all 5 data types, the **"Publish"** button should become enabled
7. Click **"Publish"** to publish the App Privacy information

**Important**: If the "Publish" button is disabled, make sure all data types are fully configured.

---

### Issue 3: Tracking Disclosure Issue

**Current Status**: 
- ✅ `NSUserTrackingUsageDescription` removed from `app.json` (line 23)
- ❌ Current build (1.0.0 (12)) still contains the tracking permission

**Two Options**:

#### Option A: Rebuild App (RECOMMENDED - Clean Solution)

Since we've already removed the tracking permission from code, rebuild the app:

**Steps**:
1. **Commit and push changes** (if not already done):
   ```bash
   cd "C:\Users\USER\Pictures\stage2\mobile app1 - Copy - Copy"
   git add app.json
   git commit -m "Remove NSUserTrackingUsageDescription - app does not use tracking"
   git push origin main-clean
   ```

2. **Build new version via EAS Web Interface** (Recommended - avoids Windows issues):
   - Go to: https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds
   - Click **"Build From GitHub"** or **"New Build"** (if available)
   - Select **iOS** → **Production**
   - Wait for build to complete (~15-30 minutes)
   - Build number will automatically increment to 1.0.0 (13)

3. **Upload new build to App Store Connect**:
   - After build completes, it should automatically be uploaded to TestFlight
   - OR manually submit via EAS CLI: `eas submit --platform ios --latest` (may have Windows issues)

4. **Select new build in App Store Connect**:
   - Go to: **Distribution** → **iOS App** → **1.0 Prepare for Submission**
   - Scroll to **"Build"** section
   - Click **"Add Build"** or **"Select Build"** button (if available)
   - Select the new build (1.0.0 (13)) from the list
   - Save changes

#### Option B: Declare Tracking in App Privacy (QUICK - For Current Build)

If you want to submit immediately with current build (1.0.0 (12)):

**Steps**:
1. Navigate to: **App Store** → **Trust & Safety** → **App Privacy**
2. When configuring data types (Issue 2), for each data type:
   - **Used for Tracking**: Select **"Yes"**
   - Complete the tracking disclosure questionnaire
   - Specify which data is used for tracking purposes
3. Complete the tracking disclosure for all 5 data types
4. Publish App Privacy information

**Note**: This is less ideal since your app doesn't actually use tracking, but it will allow immediate submission with the current build.

---

## 📋 Complete Action Checklist

Follow these steps **IN ORDER**:

### Step 1: Fix Primary Category ⚠️
- [ ] Navigate to App Information
- [ ] Find "Primary Category" dropdown
- [ ] Select **Travel** or **Lifestyle**
- [ ] Click **Save**

### Step 2: Configure App Privacy Usage Purposes ⚠️
- [ ] Navigate to App Privacy page
- [ ] Click on **Name** data type card
- [ ] Configure: App Functionality, Linked to User Identity: Yes, Tracking: No
- [ ] Save
- [ ] Repeat for **Email Address**
- [ ] Repeat for **Phone Number**
- [ ] Repeat for **Payment Info**
- [ ] Repeat for **Photos or Video**
- [ ] Click **Publish** button (should be enabled after all are configured)

### Step 3: Fix Tracking Disclosure ⚠️
- [ ] **Choose Option A (Rebuild)** OR **Option B (Declare Tracking)**
- [ ] If Option A: Commit changes, rebuild via EAS web interface, upload new build, select new build
- [ ] If Option B: Configure tracking disclosure in App Privacy for each data type

### Step 4: Select Build (if using Option A)
- [ ] Navigate to "Prepare for Submission" page
- [ ] Find **"Build"** section
- [ ] Click **"Add Build"** or **"Select Build"** button
- [ ] Select build 1.0.0 (13) from TestFlight (if using Option A)
- [ ] OR keep build 1.0.0 (12) if using Option B

### Step 5: Verify All Requirements ✅
- [ ] Primary category selected
- [ ] App Privacy usage purposes configured for all 5 data types
- [ ] App Privacy information published
- [ ] Tracking disclosure resolved (either rebuild OR declared)
- [ ] Build selected in "Prepare for Submission"
- [ ] Screenshots added (already done ✅)
- [ ] Description and Subtitle filled (if required)
- [ ] Privacy Policy URL added (already done ✅ - http://ledgeroofing.com/#contact)
- [ ] Sign-in information provided (already done ✅)

### Step 6: Submit for Review 🚀
- [ ] Navigate to: **Distribution** → **iOS App** → **1.0 Prepare for Submission**
- [ ] Scroll to bottom
- [ ] Verify "Add for Review" button is **enabled** (not disabled, not "Processing")
- [ ] Click **"Add for Review"** button
- [ ] Confirm submission
- [ ] Wait for Apple's review (typically 24-48 hours)

---

## 🎯 Recommended Approach

**Best Solution (Clean & Proper)**:
1. Fix Primary Category (Step 1)
2. Configure App Privacy usage purposes (Step 2) - Set Tracking to **NO**
3. **Option A**: Rebuild app without tracking permission (Step 3)
4. Select new build (Step 4)
5. Submit for review (Step 6)

**Quick Solution (Fast but Less Ideal)**:
1. Fix Primary Category (Step 1)
2. Configure App Privacy usage purposes (Step 2) - Set Tracking to **YES** for current build
3. **Option B**: Declare tracking in App Privacy (Step 3)
4. Keep current build 1.0.0 (12) (Step 4 - skip selecting new build)
5. Submit for review (Step 6)

---

## ⏱️ Estimated Time

- **Primary Category**: ~2-5 minutes
- **App Privacy Usage Purposes**: ~10-15 minutes (configuring 5 data types)
- **Rebuild (Option A)**: ~15-30 minutes (build time) + ~5 minutes (upload/select)
- **Declare Tracking (Option B)**: ~10-15 minutes (additional configuration)
- **Final Submission**: ~1-2 minutes

**Total Time**:
- Option A (Rebuild): ~45-60 minutes
- Option B (Declare Tracking): ~25-35 minutes

---

## 🚨 Important Notes

1. **Admin Access Required**: Some sections (like App Privacy) may require Admin role. Make sure you're logged in as an Admin.

2. **Build Selection**: After fixing all issues, you need to ensure a build is selected. Check the "Build" section on the "Prepare for Submission" page.

3. **Publish App Privacy**: Make sure to click "Publish" after configuring all App Privacy data types. The information must be published before submission.

4. **Tracking Disclosure**: If you choose Option B (declare tracking), you'll need to rebuild later anyway to remove the tracking permission from the actual app binary.

5. **Review Time**: After submission, Apple typically reviews apps within 24-48 hours, but can take up to 7 days.

---

## 📞 Need Help?

If you encounter issues:
- **Primary Category**: The field might be hidden or require initial App Store setup. Try navigating to App Store listing directly.
- **App Privacy**: Make sure you click on each data type card individually and complete the full questionnaire.
- **Rebuild**: If EAS build fails, check build logs and ensure all dependencies are correct.
- **Build Selection**: The build might already be selected automatically. Check the "Build" section to verify.

---

## ✅ Success Indicators

After completing all steps, you should see:
- ✅ "Add for Review" button is **enabled** (not disabled, not "Processing")
- ✅ No error messages or warnings
- ✅ All sections show as complete
- ✅ Build is selected and visible in the "Build" section
- ✅ App Privacy shows as "Published"

---

## 🎉 After Submission

Once you click "Add for Review":
1. Your app will enter "Waiting for Review" status
2. Apple will send email notifications about review status
3. Review typically takes 24-48 hours (can be faster or slower)
4. You'll be notified if approved, rejected, or if additional information is needed
5. If approved, your app will be released according to your settings (automatic or manual)






