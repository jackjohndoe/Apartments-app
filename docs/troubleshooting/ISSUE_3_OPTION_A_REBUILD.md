# Issue 3 - Option A: Rebuild App (Clean Solution)

## Steps to Complete Issue 3:

### 1. Commit and Push Changes
```bash
cd "C:\Users\USER\Pictures\stage2\mobile app1 - Copy - Copy"
git add app.json
git commit -m "Remove NSUserTrackingUsageDescription - app does not use tracking"
git push origin main-clean
```

### 2. Build New Version via EAS Web Interface
- Go to: https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds
- Click **"New Build"** or **"Build From GitHub"**
- Select: **iOS** → **Production**
- Wait for build to complete (~15-30 minutes)
- Build number will automatically increment to 1.0.0 (13)

### 3. Build Will Auto-Upload to TestFlight
- After build completes, it should automatically upload to App Store Connect TestFlight

### 4. Select New Build in App Store Connect
- Go to: https://appstoreconnect.apple.com/apps/6756714869/distribution/ios/version/inflight
- Find **"Build"** section
- Click **"Add Build"** or **"Select Build"** button
- Select build 1.0.0 (13) from TestFlight
- Save changes

### 5. Configure App Privacy (Still Required - Issue 2)
- Go to: https://appstoreconnect.apple.com/apps/6756714869/distribution/privacy
- Click **"Edit"** next to "Data Type"
- Select **"Yes, we collect data from this app"**
- Click **"Next"** or **"Save"**
- Configure usage purposes for all 5 data types (Name, Email, Phone, Payment, Photos):
  - Usage Purpose: **App Functionality**
  - Linked to User Identity: **Yes**
  - Used for Tracking: **NO** (since we removed tracking permission)
- Click **"Publish"** when done

**Total Time**: ~30-45 minutes (including build time)






