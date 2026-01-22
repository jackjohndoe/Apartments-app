# EAS Web Build - Step by Step Guide

## Direct Link
**https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app/builds**

## Steps to Create Build

### Step 1: Navigate to Builds Page
1. Go to the link above
2. You should see your project's build history

### Step 2: Create New Build
1. Look for a **"Create a build"** or **"New build"** button (usually at the top right)
2. Click it

### Step 3: Configure Build
Select the following options:
- **Platform**: iOS
- **Profile**: production
- **Distribution**: App Store

### Step 4: Start Build
1. Review the configuration
2. Click **"Create build"** or **"Start build"**

### Step 5: Monitor Progress
- Build will start automatically
- You'll see progress updates
- Takes approximately 15-30 minutes
- You'll receive an email when complete

## What Happens Next

Once the build completes:
1. Build will be automatically uploaded to App Store Connect
2. You'll see it in TestFlight
3. Then submit it for App Store review

## Alternative: Use EAS CLI (If Web Doesn't Work)

If the web interface doesn't work, try cleaning temp files first:

```powershell
# Clean EAS temp directory
Remove-Item -Path "$env:LOCALAPPDATA\Temp\eas-cli-nodejs" -Recurse -Force -ErrorAction SilentlyContinue

# Then try build again
eas build --platform ios --profile production
```

## Build Details

- **Version**: 1.0.0
- **Build Number**: Will auto-increment (20+)
- **Profile**: production
- **Platform**: iOS
- **All fixes applied**: ✅

## Need Help?

If you can't find the "Create build" button:
1. Make sure you're logged in
2. Check that you're on the correct project page
3. Try refreshing the page









