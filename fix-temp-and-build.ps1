# Fix temp directory issue and build
# This script addresses the Windows temp directory conflict

Write-Host "Fixing temp directory issue..." -ForegroundColor Yellow

# Method 1: Clear the temp directory
$tempPath = "$env:LOCALAPPDATA\Temp\eas-cli-nodejs"
if (Test-Path $tempPath) {
    Write-Host "Clearing existing temp directory..." -ForegroundColor Yellow
    Get-ChildItem -Path $tempPath -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item -Path $tempPath -Force -Recurse -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Method 2: Set a custom temp directory for this session
$customTemp = "$env:TEMP\eas-custom-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $customTemp -Force | Out-Null
$env:TMP = $customTemp
$env:TEMP = $customTemp
$env:TMPDIR = $customTemp

Write-Host "Using custom temp directory: $customTemp" -ForegroundColor Green
Write-Host ""

# Set token
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"

Write-Host "Starting build..." -ForegroundColor Cyan
Write-Host "Note: If you still get the temp error, try:" -ForegroundColor Yellow
Write-Host "  1. Close all terminal windows" -ForegroundColor White
Write-Host "  2. Restart PowerShell" -ForegroundColor White
Write-Host "  3. Run this script again" -ForegroundColor White
Write-Host ""

eas build --platform ios --profile production



