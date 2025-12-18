# TestFlight Quick Start Script
# Run this script to check your setup and get started

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTFLIGHT SETUP CHECK" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check EAS login
Write-Host "Checking EAS login status..." -ForegroundColor Yellow
$easStatus = eas whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ EAS CLI: Logged in as $easStatus" -ForegroundColor Green
} else {
    Write-Host "❌ EAS CLI: Not logged in" -ForegroundColor Red
    Write-Host "   Run: eas login" -ForegroundColor Yellow
}

Write-Host ""

# Check if EAS CLI is installed
Write-Host "Checking EAS CLI installation..." -ForegroundColor Yellow
$easVersion = eas --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ EAS CLI: Installed ($easVersion)" -ForegroundColor Green
} else {
    Write-Host "❌ EAS CLI: Not installed" -ForegroundColor Red
    Write-Host "   Install with: npm install -g eas-cli" -ForegroundColor Yellow
}

Write-Host ""

# Check configuration files
Write-Host "Checking configuration files..." -ForegroundColor Yellow
if (Test-Path "app.json") {
    Write-Host "✅ app.json: Found" -ForegroundColor Green
} else {
    Write-Host "❌ app.json: Not found" -ForegroundColor Red
}

if (Test-Path "eas.json") {
    Write-Host "✅ eas.json: Found" -ForegroundColor Green
} else {
    Write-Host "❌ eas.json: Not found" -ForegroundColor Red
}

Write-Host ""

# Next steps
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NEXT STEPS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Login to EAS:" -ForegroundColor Yellow
Write-Host "   eas login" -ForegroundColor White
Write-Host ""
Write-Host "2. Configure credentials:" -ForegroundColor Yellow
Write-Host "   eas credentials" -ForegroundColor White
Write-Host ""
Write-Host "3. Build iOS app:" -ForegroundColor Yellow
Write-Host "   eas build --platform ios --profile production" -ForegroundColor White
Write-Host ""
Write-Host "4. Submit to App Store Connect:" -ForegroundColor Yellow
Write-Host "   eas submit --platform ios --latest" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: TESTFLIGHT_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""



