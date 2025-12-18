# Setup Credentials and Build Script
# This script will guide you through credential setup and then start the build

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  iOS BUILD SETUP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set token
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"
Write-Host "✅ EAS Token configured" -ForegroundColor Green

# Verify login
Write-Host ""
Write-Host "Verifying authentication..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Authenticated: $whoami" -ForegroundColor Green
} else {
    Write-Host "❌ Authentication failed" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STEP 1: SET UP CREDENTIALS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need to set up iOS credentials interactively." -ForegroundColor White
Write-Host "This will create certificates and provisioning profiles." -ForegroundColor Gray
Write-Host ""
Write-Host "Run this command:" -ForegroundColor Yellow
Write-Host "  eas credentials" -ForegroundColor Cyan
Write-Host ""
Write-Host "When prompted:" -ForegroundColor White
Write-Host "  1. Select: iOS" -ForegroundColor Gray
Write-Host "  2. Select: Set up new credentials" -ForegroundColor Gray
Write-Host "  3. Select: Let EAS handle credentials (recommended)" -ForegroundColor Gray
Write-Host "  4. Enter your Apple Developer account email and password" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter after you've completed credential setup..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STEP 2: BUILD iOS APP" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting iOS production build..." -ForegroundColor Green
Write-Host "This will take 15-30 minutes." -ForegroundColor Gray
Write-Host "You'll receive email notifications when complete." -ForegroundColor Gray
Write-Host ""

# Start the build
eas build --platform ios --profile production

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  BUILD STARTED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Wait for build to complete (15-30 minutes)" -ForegroundColor White
    Write-Host "  2. Check email for build completion notification" -ForegroundColor White
    Write-Host "  3. Or check status with: eas build:list" -ForegroundColor White
    Write-Host "  4. Once complete, submit with: eas submit --platform ios --latest" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Build failed. Check the error messages above." -ForegroundColor Red
    Write-Host ""
}



