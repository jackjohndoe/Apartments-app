# Build with custom temp directory to avoid Windows conflicts
# This uses a completely separate temp location

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  iOS BUILD WITH CUSTOM TEMP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create a unique temp directory in the project folder instead of system temp
$projectTemp = "$PWD\.eas-temp-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $projectTemp -Force | Out-Null

# Set all temp-related environment variables to use our custom directory
$env:TMP = $projectTemp
$env:TEMP = $projectTemp
$env:TMPDIR = $projectTemp
$env:TMPDIR_WIN = $projectTemp

# Also try to override Node's temp directory
$env:NODE_TMPDIR = $projectTemp

Write-Host "Using custom temp directory: $projectTemp" -ForegroundColor Green
Write-Host ""

# Kill any Node processes
Write-Host "Stopping Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clear the default EAS temp location
Write-Host "Clearing default EAS temp..." -ForegroundColor Yellow
$defaultEasTemp = "$env:LOCALAPPDATA\Temp\eas-cli-nodejs"
if (Test-Path $defaultEasTemp) {
    Get-ChildItem -Path $defaultEasTemp -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item -Path $defaultEasTemp -Force -Recurse -ErrorAction SilentlyContinue
}

Write-Host "✅ Setup complete" -ForegroundColor Green
Write-Host ""

# Set token
$env:EXPO_TOKEN = "U3nDlX8LQaU9hIkfUyossPSm9jE29O-i9SDdIIV6"

Write-Host "Starting build..." -ForegroundColor Cyan
Write-Host "When prompted for Apple account, answer: N" -ForegroundColor Yellow
Write-Host ""

# Start build
eas build --platform ios --profile production

# Cleanup temp directory after build (whether success or failure)
Write-Host ""
Write-Host "Cleaning up temp directory..." -ForegroundColor Yellow
if (Test-Path $projectTemp) {
    Start-Sleep -Seconds 2
    Remove-Item -Path $projectTemp -Recurse -Force -ErrorAction SilentlyContinue
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  BUILD STARTED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Check status: eas build:list" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Build failed. If temp error persists, try:" -ForegroundColor Red
    Write-Host "  1. Restart your computer" -ForegroundColor Yellow
    Write-Host "  2. Or contact EAS support about Windows temp directory issue" -ForegroundColor Yellow
    Write-Host ""
}



