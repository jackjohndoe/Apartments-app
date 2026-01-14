# Fix EAS Build Temp Directory Error on Windows
# Run this script before building with EAS

Write-Host "=== Fixing EAS Build Temp Directory Error ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all Node processes
Write-Host "1. Stopping Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   [OK] Node processes stopped" -ForegroundColor Green

# Step 2: Clear EAS temp directory
Write-Host "2. Clearing EAS temp directory..." -ForegroundColor Yellow
$easTempPath = "$env:LOCALAPPDATA\Temp\eas-cli-nodejs"
if (Test-Path $easTempPath) {
    # Try to remove all contents first
    Get-ChildItem -Path $easTempPath -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    # Then remove the directory itself
    Remove-Item -Path $easTempPath -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "   [OK] Temp directory cleared" -ForegroundColor Green
} else {
    Write-Host "   [OK] Temp directory does not exist (already clean)" -ForegroundColor Green
}

# Step 3: Clear any other EAS temp patterns
Write-Host "3. Clearing other EAS temp files..." -ForegroundColor Yellow
$tempDir = $env:LOCALAPPDATA + "\Temp"
Get-ChildItem -Path $tempDir -Filter "eas-*" -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $tempDir -Filter "*eas-cli*" -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   [OK] Other temp files cleared" -ForegroundColor Green

# Step 4: Set clean environment variables
Write-Host "4. Setting environment variables..." -ForegroundColor Yellow
$customTemp = "$env:USERPROFILE\AppData\Local\Temp\eas-custom"
if (-not (Test-Path $customTemp)) {
    New-Item -ItemType Directory -Path $customTemp -Force | Out-Null
}
$env:TMPDIR = $customTemp
$env:TMP = $customTemp
$env:TEMP = $customTemp
Write-Host "   [OK] Environment variables set" -ForegroundColor Green

# Step 5: Wait a moment for file system to settle
Write-Host "5. Waiting for file system to settle..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "   [OK] Ready" -ForegroundColor Green

Write-Host ""
Write-Host "=== Fix Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run:" -ForegroundColor Cyan
Write-Host "  eas build --platform ios --profile production" -ForegroundColor White
Write-Host ""
Write-Host "If the error persists:" -ForegroundColor Yellow
Write-Host "  1. Close this terminal completely" -ForegroundColor White
Write-Host "  2. Open a NEW terminal window" -ForegroundColor White
Write-Host "  3. Navigate to your project directory" -ForegroundColor White
Write-Host "  4. Run this script again, then try the build" -ForegroundColor White
Write-Host "  5. If still failing, restart your computer" -ForegroundColor White
Write-Host ""

