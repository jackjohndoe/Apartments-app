# Force Build Script - Aggressive cleanup before build
# This script does everything possible to clear the temp directory issue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AGGRESSIVE CLEANUP & BUILD" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill ALL Node processes
Write-Host "Step 1: Killing all Node.js processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Step 2: Kill any processes using the temp directory
Write-Host "Step 2: Checking for processes using temp directory..." -ForegroundColor Yellow
$tempPath = "$env:LOCALAPPDATA\Temp\eas-cli-nodejs"
if (Test-Path $tempPath) {
    # Try to find and kill processes that might be locking files
    Get-Process | Where-Object {
        $_.Path -like "*node*" -or 
        $_.Path -like "*eas*" -or
        $_.Path -like "*git*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

# Step 3: Delete the temp directory with retries
Write-Host "Step 3: Deleting temp directory (with retries)..." -ForegroundColor Yellow
$maxRetries = 5
$retryCount = 0
$deleted = $false

while (-not $deleted -and $retryCount -lt $maxRetries) {
    if (Test-Path $tempPath) {
        try {
            # Try to remove all contents first
            Get-ChildItem -Path $tempPath -Recurse -Force -ErrorAction SilentlyContinue | 
                Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
            
            # Then remove the directory itself
            Remove-Item -Path $tempPath -Force -Recurse -ErrorAction Stop
            $deleted = $true
            Write-Host "✅ Temp directory deleted (attempt $($retryCount + 1))" -ForegroundColor Green
        } catch {
            $retryCount++
            Write-Host "⚠️  Attempt $retryCount failed, retrying..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    } else {
        $deleted = $true
        Write-Host "✅ Temp directory doesn't exist" -ForegroundColor Green
    }
}

if (-not $deleted) {
    Write-Host "❌ Could not delete temp directory after $maxRetries attempts" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please try:" -ForegroundColor Yellow
    Write-Host "  1. Restart your computer" -ForegroundColor White
    Write-Host "  2. Or manually delete: $tempPath" -ForegroundColor White
    Write-Host "  3. Then run this script again" -ForegroundColor White
    exit 1
}

# Step 4: Wait a bit more to ensure everything is released
Write-Host "Step 4: Waiting for file system to release locks..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 5: Set token
Write-Host "Step 5: Setting up authentication..." -ForegroundColor Yellow
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"

# Verify auth
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Authenticated: $whoami" -ForegroundColor Green
} else {
    Write-Host "❌ Authentication failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STARTING BUILD" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "When prompted for Apple account, answer: N" -ForegroundColor Yellow
Write-Host ""

# Start build immediately after cleanup
eas build --platform ios --profile production

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  BUILD STARTED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Build still failed with temp error." -ForegroundColor Red
    Write-Host ""
    Write-Host "This is a known Windows issue with EAS CLI." -ForegroundColor Yellow
    Write-Host "Recommended solutions:" -ForegroundColor Yellow
    Write-Host "  1. RESTART YOUR COMPUTER (most reliable)" -ForegroundColor White
    Write-Host "  2. Use EAS Web Interface: https://expo.dev" -ForegroundColor White
    Write-Host "  3. Contact EAS support about Windows temp directory bug" -ForegroundColor White
    Write-Host ""
}


