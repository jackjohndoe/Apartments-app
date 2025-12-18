# iOS Build Script - Clears temp files and starts build
# Run this script to build your iOS app

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CLEARING TEMP FILES" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop any EAS processes
Write-Host "Stopping any running EAS processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.Path -like "*eas*" -or $_.Path -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clear temp directory
Write-Host "Clearing EAS temp directory..." -ForegroundColor Yellow
$tempPath = "$env:LOCALAPPDATA\Temp\eas-cli-nodejs"
if (Test-Path $tempPath) {
    Remove-Item -Path $tempPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Temp directory cleared" -ForegroundColor Green
} else {
    Write-Host "✅ Temp directory doesn't exist (already clean)" -ForegroundColor Green
}

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STARTING iOS BUILD" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set token
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"

# Start build
Write-Host "Starting build..." -ForegroundColor Yellow
Write-Host "When prompted:" -ForegroundColor Gray
Write-Host "  - Apple account login: Answer N (credentials already set up)" -ForegroundColor Gray
Write-Host "  - Push Notifications: Answer No or 'No, don't ask again'" -ForegroundColor Gray
Write-Host ""

eas build --platform ios --profile production

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  BUILD STARTED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Build is running in the cloud..." -ForegroundColor Yellow
    Write-Host "Check status with: eas build:list" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Build failed. Try running this script again." -ForegroundColor Red
    Write-Host ""
}



