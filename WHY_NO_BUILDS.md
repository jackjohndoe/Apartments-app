# Why Builds Aren't Appearing in App Store Connect

## Problem
Builds are not showing up in App Store Connect TestFlight, even though EAS builds are completing successfully.

## Root Cause
The `eas.json` file is **missing the App Store Connect App ID (`ascAppId`)** in the submit configuration. Without this, EAS doesn't know which app in App Store Connect to upload the build to.

## Current Configuration Issue

**Current `eas.json` submit section:**
```json
"submit": {
  "production": {}
}
```

**This is missing the `ascAppId` field!**

## Solution

### Step 1: Find Your App Store Connect App ID

1. Go to App Store Connect: https://appstoreconnect.apple.com
2. Navigate to your app: **Nigerian Apartments**
3. The App ID is in the URL: `https://appstoreconnect.apple.com/apps/6756663377/...`
   - **Your App ID is: `6756663377`**

### Step 2: Update `eas.json`

Add the `ascAppId` to your submit configuration:

```json
{
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "6756663377"
      }
    }
  }
}
```

### Step 3: Resubmit the Build

After updating `eas.json`, you can either:

**Option A: Submit existing build (if still available)**
```bash
eas submit --platform ios --latest
```

**Option B: Create new build and submit**
```bash
eas build --platform ios --profile production
# Then after build completes:
eas submit --platform ios --latest
```

## Why This Happens

1. **EAS builds complete successfully** - The build process works fine
2. **EAS submissions start** - The submission process begins
3. **Submission fails silently** - Without `ascAppId`, EAS doesn't know where to upload
4. **Build never appears** - Since upload fails, build never reaches App Store Connect

## Verification

After adding `ascAppId` and resubmitting:
1. Check EAS submissions page - should show "Finished" status
2. Wait 5-10 minutes
3. Check App Store Connect TestFlight - build should appear
4. Check Prepare for Submission page - build should be selectable

## Additional Notes

- The App ID (`6756663377`) is different from the Bundle ID (`com.nigerianapartments.app`)
- The App ID is unique to your app in App Store Connect
- Once configured, future submissions will work automatically







