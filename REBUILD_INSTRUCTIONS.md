# Rebuild App - Instructions

## ✅ All Fixes Applied

The following fixes have been committed to your repository:
1. ✅ Disabled Google Sign In with placeholder credentials
2. ✅ Removed "USE DEMO IMAGE" button
3. ✅ Fixed placeholder email fallback
4. ✅ Removed unused RECORD_AUDIO permission

## 🚀 Rebuild via EAS Web Interface (Recommended)

Due to Windows path issues with command line builds, use the web interface:

### Step 1: Go to EAS Dashboard
**Link**: https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds

### Step 2: Create New Build
1. Click **"Create a build"** button
2. Select:
   - **Platform**: iOS
   - **Profile**: production
3. Click **"Create build"**

### Step 3: Monitor Build
- Build will start automatically
- Takes ~15-30 minutes
- You'll receive email notification when complete

### Step 4: Submit to App Store
Once build completes:
```bash
eas submit --platform ios --latest
```

Or manually upload via App Store Connect.

## 📋 Build Details

- **Version**: 1.0.0
- **Build Number**: Will auto-increment (17+)
- **Profile**: production
- **Platform**: iOS

## 🔧 Alternative: Fix Windows Issues First

If you prefer command line, fix Windows git repository first:

1. **Move project outside user home directory**:
   ```powershell
   # Move to a clean location
   Move-Item "C:\Users\USER\Pictures\stage2\mobile app1 - Copy - Copy" "C:\Projects\nigerian-apartments-app"
   ```

2. **Initialize git only in project directory**:
   ```powershell
   cd "C:\Projects\nigerian-apartments-app"
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Then build**:
   ```powershell
   eas build --platform ios --profile production
   ```

## ✅ What's Fixed

All App Store rejection issues have been resolved:
- ✅ No placeholder credentials
- ✅ No demo/test features
- ✅ No placeholder content  
- ✅ Only necessary permissions

The app is ready for App Store submission once rebuilt!









