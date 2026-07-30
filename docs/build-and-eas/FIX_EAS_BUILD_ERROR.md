# Fix EAS Build Error - File Already Exists

## Error
```
EEXIST: file already exists, mkdir 'C:\Users\USER\AppData\Local\Temp\eas-cli-nodejs\...'
```

## Solution

This error occurs when EAS CLI temp files from a previous build attempt are still present.

### Quick Fix (Run in PowerShell):

```powershell
# Clear EAS temp directory
Remove-Item -Path "$env:LOCALAPPDATA\Temp\eas-cli-nodejs" -Recurse -Force -ErrorAction SilentlyContinue
```

### Or manually:
1. Open File Explorer
2. Navigate to: `C:\Users\USER\AppData\Local\Temp\eas-cli-nodejs`
3. Delete the entire `eas-cli-nodejs` folder
4. Retry the build

### After clearing, retry build:
```bash
eas build --platform ios --profile production
```

## Alternative: Use Different Approach

If the error persists, you can also try:

1. **Close and reopen terminal** - Sometimes helps clear file locks
2. **Restart your computer** - Ensures all file handles are released
3. **Check for running EAS processes** - Make sure no other EAS commands are running

## Prevention

This usually happens when:
- A previous build was interrupted
- Multiple build attempts were made quickly
- System crashed during a build

**Solution:** Always wait for builds to complete or properly cancel them before starting new ones.














