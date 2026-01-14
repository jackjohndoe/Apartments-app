# Clean Before Build - Run this RIGHT BEFORE running eas build
# This script aggressively cleans temp directories to prevent EEXIST errors

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CLEANING BEFORE EAS BUILD" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all Node processes
Write-Host "[1/5] Stopping all Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped PID: $($_.Id)" -ForegroundColor Gray
        } catch {
            # Ignore errors
        }
    }
    Start-Sleep -Seconds 2
    Write-Host "  [OK] Node processes stopped" -ForegroundColor Green
} else {
    Write-Host "  [OK] No Node processes running" -ForegroundColor Green
}

# Step 2: Remove specific problematic directory
Write-Host "[2/5] Removing problematic temp directories..." -ForegroundColor Yellow
$easTempRoot = "$env:LOCALAPPDATA\Temp\eas-cli-nodejs"
if (Test-Path $easTempRoot) {
    try {
        # Remove all subdirectories first
        Get-ChildItem -Path $easTempRoot -Directory -ErrorAction SilentlyContinue | 
            ForEach-Object {
                try {
                    Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
                } catch {
                    # Try again after a short delay
                    Start-Sleep -Milliseconds 500
                    Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
                }
            }
        # Remove the root directory
        Remove-Item -Path $easTempRoot -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  [OK] Removed eas-cli-nodejs directory" -ForegroundColor Green
    } catch {
        Write-Host "  [WARNING] Could not fully remove: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [OK] Directory does not exist" -ForegroundColor Green
}

# Step 3: Remove any other EAS temp patterns
Write-Host "[3/5] Cleaning other EAS temp files..." -ForegroundColor Yellow
$tempDir = "$env:LOCALAPPDATA\Temp"
Get-ChildItem -Path $tempDir -Filter "*eas*" -Directory -ErrorAction SilentlyContinue | 
    ForEach-Object {
        try {
            Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        } catch {
            # Ignore errors
        }
    }
Write-Host "  [OK] Cleaned other temp files" -ForegroundColor Green

# Step 4: Wait for file system to settle
Write-Host "[4/5] Waiting for file system to settle..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "  [OK] Ready" -ForegroundColor Green

# Step 5: Verify cleanup
Write-Host "[5/5] Verifying cleanup..." -ForegroundColor Yellow
if (Test-Path $easTempRoot) {
    Write-Host "  [WARNING] Directory still exists - may need restart" -ForegroundColor Yellow
} else {
    Write-Host "  [OK] Cleanup verified" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run:" -ForegroundColor Cyan
Write-Host "  eas build --platform ios --profile production" -ForegroundColor White
Write-Host ""












