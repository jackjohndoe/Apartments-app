# Build via EAS Web Interface (Recommended - Bypasses Windows Issues)

Since the Windows temp directory issue persists, use the EAS web interface to build your app. This completely bypasses local file system issues.

## Steps:

1. **Go to EAS Dashboard:**
   - Visit: https://expo.dev
   - Log in with your account (michaelkaysea)

2. **Navigate to Your Project:**
   - Click on your project: `nigerian-apartments-app`
   - Or go directly to: https://expo.dev/accounts/michaelkaysea/projects/nigerian-apartments-app

3. **Start a Build:**
   - Click "Builds" in the left sidebar
   - Click the "+" button or "Create a build"
   - Select:
     - **Platform:** iOS
     - **Profile:** production
     - **Workflow:** Managed
   - Click "Create build"

4. **Monitor Progress:**
   - Watch the build progress in real-time
   - You'll get email notifications when complete
   - Build typically takes 15-30 minutes

5. **After Build Completes:**
   - Download the `.ipa` file
   - Or use `eas submit` to automatically submit to App Store Connect

## Advantages:
- ✅ No Windows temp directory issues
- ✅ No interactive prompts needed
- ✅ Real-time build logs
- ✅ Works from any device/browser

## Submit After Build:

Once the build completes, run:
```powershell
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"
eas submit --platform ios --latest
```

This will submit the latest build to App Store Connect automatically.

