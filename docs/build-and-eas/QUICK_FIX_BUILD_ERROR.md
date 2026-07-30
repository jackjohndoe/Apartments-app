# Quick Fix for EAS Build EEXIST Error

## The Problem
```
EEXIST: file already exists, mkdir 'C:\Users\USER\AppData\Local\Temp\eas-cli-nodejs\...'
```

## The Solution (3 Steps)

### Step 1: Run Clean Script
**BEFORE running the build**, run this command:
```powershell
.\clean-before-build.ps1
```

This will:
- Stop all Node processes
- Remove temp directories
- Clean up locked files

### Step 2: Close Terminal
**IMPORTANT:** Close your current terminal completely after running the clean script.

### Step 3: Open New Terminal & Build
1. Open a **brand new** PowerShell window
2. Navigate to your project:
   ```powershell
   cd "C:\Users\USER\Pictures\stage2\mobile app1 - Copy - Copy"
   ```
3. Run the build:
   ```bash
   eas build --platform ios --profile production
   ```

## If It Still Fails

### Option A: Restart Computer
1. Save all your work
2. Restart your computer (this releases all file locks)
3. Open a fresh terminal
4. Navigate to project
5. Run `.\clean-before-build.ps1`
6. Run `eas build --platform ios --profile production`

### Option B: Use Administrator Terminal
1. Right-click PowerShell
2. Select "Run as Administrator"
3. Navigate to project
4. Run `.\clean-before-build.ps1`
5. Run `eas build --platform ios --profile production`

## Why This Happens

Windows file locking can keep temp directories locked after:
- Interrupted builds (Ctrl+C)
- Failed builds
- Multiple simultaneous builds
- Background Node processes

## Prevention

**Always run the clean script before building:**
```powershell
.\clean-before-build.ps1
```

This prevents the error from happening in the first place.

## Summary

**Quick Command Sequence:**
```powershell
# 1. Clean
.\clean-before-build.ps1

# 2. Close terminal, open new one

# 3. Build
eas build --platform ios --profile production
```

If that doesn't work, restart your computer and try again.












