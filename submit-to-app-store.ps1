# App Store Submission Script for Apartify Africa (PowerShell)
# This script automates the build and submission process

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  APARTIFY AFRICA - APP STORE SUBMISSION" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
try {
    $null = Get-Command eas -ErrorAction Stop
    Write-Host "✅ EAS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ EAS CLI is not installed" -ForegroundColor Red
    Write-Host "Install it with: npm install -g eas-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 1: Check login status
Write-Host "Step 1: Checking EAS login status..." -ForegroundColor Yellow
$loginCheck = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in. Please login:" -ForegroundColor Yellow
    eas login
} else {
    Write-Host "✅ Already logged in" -ForegroundColor Green
    eas whoami
}
Write-Host ""

# Step 2: Verify credentials
Write-Host "Step 2: Verifying iOS credentials..." -ForegroundColor Yellow
$credResponse = Read-Host "Do you want to check/update credentials? (y/n)"
if ($credResponse -eq "y" -or $credResponse -eq "Y") {
    eas credentials
}
Write-Host ""

# Step 3: Build production app
Write-Host "Step 3: Building production app..." -ForegroundColor Yellow
Write-Host "This will take 15-30 minutes..." -ForegroundColor Yellow
$buildResponse = Read-Host "Continue with build? (y/n)"
if ($buildResponse -eq "y" -or $buildResponse -eq "Y") {
    Write-Host "Starting build..." -ForegroundColor Green
    eas build --platform ios --profile production
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build started successfully" -ForegroundColor Green
        Write-Host "Monitor progress with: eas build:list" -ForegroundColor Cyan
        Write-Host ""
        
        # Step 4: Submit to App Store
        $submitResponse = Read-Host "Build started. Submit to App Store when build completes? (y/n)"
        if ($submitResponse -eq "y" -or $submitResponse -eq "Y") {
            Write-Host ""
            Write-Host "Waiting for build to complete..." -ForegroundColor Yellow
            Write-Host "You'll receive an email when the build is ready." -ForegroundColor Cyan
            Write-Host ""
            Read-Host "Press Enter when build is complete to submit..."
            
            Write-Host "Submitting to App Store..." -ForegroundColor Green
            eas submit --platform ios --latest
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Submission successful!" -ForegroundColor Green
                Write-Host "Check App Store Connect for processing status." -ForegroundColor Cyan
            } else {
                Write-Host "❌ Submission failed" -ForegroundColor Red
                Write-Host "Check the error message above." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
        Write-Host "Check the error message above." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Build cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  SUBMISSION PROCESS COMPLETE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to App Store Connect" -ForegroundColor White
Write-Host "2. Complete app listing (screenshots, description)" -ForegroundColor White
Write-Host "3. Submit for review" -ForegroundColor White
Write-Host ""
Write-Host "See APP_STORE_SUBMISSION_GUIDE.md for details." -ForegroundColor Cyan


