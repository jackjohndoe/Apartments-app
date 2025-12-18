# Start iOS Build Now - Web Interface (100% Reliable)

The EAS CLI has persistent Windows issues. Use the web interface instead - it's faster and more reliable.

## Step 1: Start Build via Web

1. **Open your browser and go to:**
   ```
   https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds
   ```

2. **Click the big "+" button or "Create a build"**

3. **Select:**
   - **Platform:** iOS
   - **Profile:** production
   - **Workflow:** Managed (default)

4. **Click "Create build"**

5. **Watch the build progress in real-time!**

## Step 2: Monitor Build

- Build takes **15-30 minutes**
- You'll see progress updates in the browser
- You'll receive email notifications when complete
- Build URL will be shown (e.g., `https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds/[BUILD_ID]`)

## Step 3: After Build Completes

Once the build is done, you have two options:

### Option A: Automatic Submit (Recommended)

Run this command in your terminal:
```powershell
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"
eas submit --platform ios --latest
```

This automatically submits the latest build to App Store Connect.

### Option B: Manual Upload

1. Download the `.ipa` file from the build page
2. Use **Transporter** app (Mac) or **Xcode** to upload
3. Or use App Store Connect web interface

## Step 4: Set Up TestFlight

1. **Go to App Store Connect:**
   - https://appstoreconnect.apple.com
   - Log in with your Apple Developer account

2. **Create App (if not already created):**
   - Click "My Apps" → "+" → "New App"
   - Fill in:
     - Platform: iOS
     - Name: Nigerian Apartments
     - Bundle ID: `com.nigerianapartments.app`
     - SKU: `nigerian-apartments-001`

3. **Go to TestFlight Tab:**
   - Your build should appear after processing (10-30 minutes)
   - If it doesn't appear, make sure you submitted it (Step 3)

4. **Add Testers:**
   - **Internal Testing:** Up to 100 team members (no review needed)
   - **External Testing:** Up to 10,000 testers (requires Beta App Review)

5. **For External Testing:**
   - Complete "Beta App Review" information
   - Submit for review (24-48 hours)

## Quick Links

- **EAS Dashboard:** https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app
- **Builds Page:** https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds
- **App Store Connect:** https://appstoreconnect.apple.com

## Why Web Interface?

✅ No Windows temp directory issues  
✅ No interactive prompts  
✅ Real-time build logs  
✅ Works from any device  
✅ More reliable than CLI on Windows  

---

**Start your build now:** https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds

Click the "+" button and select iOS + production! 🚀

