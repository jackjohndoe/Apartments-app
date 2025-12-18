# EAS Setup Script with Token
# This script sets your EAS token and guides you through the next steps

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EAS SETUP WITH TOKEN" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set the token
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"
Write-Host "✅ EAS Token set" -ForegroundColor Green

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
Write-Host "  NEXT STEPS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Set up iOS credentials" -ForegroundColor Yellow
Write-Host "Run this command:" -ForegroundColor White
Write-Host "  eas credentials" -ForegroundColor Cyan
Write-Host ""
Write-Host "When prompted:" -ForegroundColor Gray
Write-Host "  1. Select: iOS" -ForegroundColor Gray
Write-Host "  2. Select: Set up new credentials" -ForegroundColor Gray
Write-Host "  3. Select: Let EAS handle credentials (recommended)" -ForegroundColor Gray
Write-Host "  4. Enter your Apple Developer account credentials" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 2: Build iOS app" -ForegroundColor Yellow
Write-Host "Once credentials are set up, run:" -ForegroundColor White
Write-Host "  eas build --platform ios --profile production" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 3: Submit to App Store Connect" -ForegroundColor Yellow
Write-Host "After build completes, run:" -ForegroundColor White
Write-Host "  eas submit --platform ios --latest" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Keep token in environment for this session
Write-Host "Note: Token is set for this PowerShell session." -ForegroundColor Gray
Write-Host "To use in a new session, run:" -ForegroundColor Gray
Write-Host '  $env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"' -ForegroundColor Gray
Write-Host ""



