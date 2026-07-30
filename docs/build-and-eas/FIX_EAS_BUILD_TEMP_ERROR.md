# Fix EAS Build Temp Directory Error

## Error
```
EEXIST: file already exists, mkdir 'C:\Users\USER\AppData\Local\Temp\eas-cli-nodejs\...'
```

## Root Cause
EAS CLI creates temporary directories during the build process. If a previous build was interrupted or failed, these directories can remain locked, causing subsequent builds to fail.

## Solutions

### Solution 1: Clear Temp Directory (Quick Fix)

Run this in PowerShell:
```powershell
Remove-Item -Path "$env:LOCALAPPDATA\Temp\eas-cli-nodejs" -Recurse -Force -ErrorAction SilentlyContinue
```

### Solution 2: Restart Computer
If Solution 1 doesn't work, restart your computer to release all file locks.

### Solution 3: Use .easignore
I've created a `.easignore` file to exclude problematic directories from the build archive. This prevents EAS from trying to include temp files.

### Solution 4: Close All Node Processes
Sometimes Node processes can lock files. Close all Node processes:
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
```

**Warning:** This will close ALL Node processes. Make sure you save your work first.

### Solution 5: Use Different Build Approach
If the issue persists, try:
1. Close all terminals
2. Restart your computer
3. Open a fresh terminal
4. Navigate to project directory
5. Run: `eas build --platform ios --profile production`

## Prevention

1. **Always wait for builds to complete** - Don't interrupt builds
2. **Don't run multiple builds simultaneously** - Wait for one to finish
3. **Clear temp directory before builds** if you've had interrupted builds:
   ```powershell
   Remove-Item -Path "$env:LOCALAPPDATA\Temp\eas-cli-nodejs" -Recurse -Force -ErrorAction SilentlyContinue
   ```

## After Fixing

Once you've cleared the temp directory, retry the build:
```bash
eas build --platform ios --profile production
```

The build should proceed without the "file already exists" error.














