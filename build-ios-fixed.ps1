# Fixed iOS Build Script - Handles Windows temp directory issues
# This script kills processes, clears temp, and uses a unique temp directory

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIXING TEMP DIRECTORY ISSUE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all Node.js and EAS processes
Write-Host "Step 1: Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Step 2: Clear ALL EAS temp directories
Write-Host "Step 2: Clearing all EAS temp directories..." -ForegroundColor Yellow
$tempPaths = @(
    "$env:LOCALAPPDATA\Temp\eas-cli-nodejs",
    "$env:TEMP\eas-cli-nodejs",
    "$env:TEMP\eas-custom-*"
)

foreach ($path in $tempPaths) {
    if (Test-Path $path) {
        Get-ChildItem -Path $path -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
        Remove-Item -Path $path -Force -Recurse -ErrorAction SilentlyContinue
    }
}

# Also clear any matching patterns
Get-ChildItem -Path "$env:TEMP" -Filter "eas-*" -Directory -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
Get-ChildItem -Path "$env:LOCALAPPDATA\Temp" -Filter "eas-*" -Directory -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2
Write-Host "✅ Temp directories cleared" -ForegroundColor Green

# Step 3: Create a completely unique temp directory for this session
Write-Host "Step 3: Setting up unique temp directory..." -ForegroundColor Yellow
$uniqueId = [System.Guid]::NewGuid().ToString()
$customTemp = "$env:TEMP\eas-build-$uniqueId"
New-Item -ItemType Directory -Path $customTemp -Force | Out-Null

# Set environment variables to use this unique directory
$env:TMP = $customTemp
$env:TEMP = $customTemp
$env:TMPDIR = $customTemp
$env:TMPDIR_WIN = $customTemp

Write-Host "✅ Using unique temp directory: $customTemp" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STARTING iOS BUILD" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set token
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"

# Verify we're authenticated
Write-Host "Verifying authentication..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Authenticated: $whoami" -ForegroundColor Green
} else {
    Write-Host "❌ Not authenticated. Please check your token." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting build..." -ForegroundColor Cyan
Write-Host "This will take 15-30 minutes." -ForegroundColor Gray
Write-Host ""

# Start the build
eas build --platform ios --profile production

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  BUILD STARTED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Monitor progress:" -ForegroundColor Yellow
    Write-Host "  eas build:list" -ForegroundColor White
    Write-Host ""
    Write-Host "Or check your email for notifications." -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Build failed. Error details above." -ForegroundColor Red
    Write-Host ""
    Write-Host "If you still see temp directory errors:" -ForegroundColor Yellow
    Write-Host "  1. Close ALL terminal windows" -ForegroundColor White
    Write-Host "  2. Wait 10 seconds" -ForegroundColor White
    Write-Host "  3. Open a new PowerShell window" -ForegroundColor White
    Write-Host "  4. Run this script again" -ForegroundColor White
    Write-Host ""
}



