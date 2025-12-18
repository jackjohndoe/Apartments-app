# TestFlight Setup Script
# Run this script step by step, or run individual commands

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTFLIGHT SETUP - STEP BY STEP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify login
Write-Host "Step 1: Verifying EAS login..." -ForegroundColor Yellow
Write-Host "Run: eas whoami" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Are you logged in? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Please run: eas login" -ForegroundColor Red
    exit
}

# Step 2: Configure EAS
Write-Host ""
Write-Host "Step 2: Configuring EAS project..." -ForegroundColor Yellow
Write-Host "Run: eas build:configure" -ForegroundColor White
Write-Host "This will verify your EAS project setup." -ForegroundColor Gray
Write-Host ""
$confirm = Read-Host "Press Enter to continue (or Ctrl+C to exit)"

# Step 3: Set up credentials
Write-Host ""
Write-Host "Step 3: Setting up iOS credentials..." -ForegroundColor Yellow
Write-Host "Run: eas credentials" -ForegroundColor White
Write-Host "Select iOS, then choose 'Set up new credentials' and let EAS handle it." -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT: You'll need your Apple Developer account credentials." -ForegroundColor Cyan
Write-Host ""
$confirm = Read-Host "Press Enter to continue (or Ctrl+C to exit)"

# Step 4: Build
Write-Host ""
Write-Host "Step 4: Ready to build!" -ForegroundColor Green
Write-Host "Once credentials are set up, run:" -ForegroundColor Yellow
Write-Host "  eas build --platform ios --profile production" -ForegroundColor White
Write-Host ""
Write-Host "This will take 15-30 minutes. You'll get email notifications." -ForegroundColor Gray
Write-Host ""

Write-Host "For complete instructions, see: TESTFLIGHT_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""



