# EAS Build Windows Temp Directory Error - Complete Fix

## The Error
```
EEXIST: file already exists, mkdir 'C:\Users\USER\AppData\Local\Temp\eas-cli-nodejs\...'
```

This is a Windows-specific issue where EAS CLI tries to create a temp directory that already exists or is locked by another process.

## Quick Fix (Recommended)

**Run the fix script before building:**
```powershell
.\fix-eas-build.ps1
```

Then run your build:
```bash
eas build --platform ios --profile production
```

## Manual Fix Steps

### Option 1: Close Terminal and Retry

1. **Close your current terminal completely**
2. **Open a NEW terminal window**
3. Navigate to your project:
   ```powershell
   cd "C:\Users\USER\Pictures\stage2\mobile app1 - Copy - Copy"
   ```
4. Run the build:
   ```bash
   eas build --platform ios --profile production
   ```

### Option 2: Restart Computer

If Option 1 doesn't work:

1. **Save all your work**
2. **Restart your computer** (this releases all file locks)
3. Open a fresh terminal
4. Navigate to project directory
5. Run the build

### Option 3: Manual Cleanup

Run these commands in PowerShell:

```powershell
# Stop Node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear temp directory
Remove-Item -Path "$env:LOCALAPPDATA\Temp\eas-cli-nodejs" -Recurse -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Try build again
eas build --platform ios --profile production
```

## Why This Happens

1. **Interrupted builds** - If a previous build was stopped (Ctrl+C), temp directories may remain locked
2. **Multiple builds** - Running multiple builds simultaneously can cause conflicts
3. **Windows file locking** - Windows holds file locks longer than Unix systems
4. **Node processes** - Background Node processes can lock directories

## Prevention

1. **Always wait for builds to complete** - Don't interrupt builds with Ctrl+C
2. **Don't run multiple builds** - Wait for one to finish before starting another
3. **Use the fix script** - Run `.\fix-eas-build.ps1` before each build if you've had issues
4. **Close terminals properly** - Don't force-close terminals while builds are running

## Alternative: Use EAS Build Web Interface

If the CLI continues to have issues:

1. Go to https://expo.dev
2. Login to your account
3. Navigate to your project
4. Use the web interface to trigger builds
5. This bypasses local temp directory issues

## Still Having Issues?

If none of the above works:

1. **Check EAS CLI version:**
   ```bash
   eas --version
   npm install -g eas-cli@latest
   ```

2. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be 18.x or higher

3. **Check Git version:**
   ```bash
   git --version
   ```
   Should be 2.11.0 or higher

4. **Contact Expo Support:**
   - Discord: https://chat.expo.dev
   - Forums: https://forums.expo.dev
   - Include the full error message and your system info

## Summary

**Best approach:**
1. Run `.\fix-eas-build.ps1`
2. Close terminal
3. Open new terminal
4. Run `eas build --platform ios --profile production`

If that doesn't work, restart your computer and try again.













