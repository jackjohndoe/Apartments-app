# Force Clean EAS Temp Directory - Use when normal cleanup fails
# This uses Windows robocopy trick to force-delete locked directories

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FORCE CLEAN EAS TEMP DIRECTORY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all processes
Write-Host "[1/4] Stopping all Node/npm/eas processes..." -ForegroundColor Yellow
Get-Process | Where-Object {
    $_.Path -like "*node*" -or 
    $_.Path -like "*npm*" -or 
    $_.Path -like "*eas*" -or
    $_.ProcessName -eq "node" -or
    $_.ProcessName -eq "npm"
} | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  Stopped: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    } catch {
        # Ignore errors
    }
}
Start-Sleep -Seconds 3
Write-Host "  [OK] Processes stopped" -ForegroundColor Green

# Step 2: Create empty directory for robocopy
Write-Host "[2/4] Preparing robocopy cleanup..." -ForegroundColor Yellow
$emptyDir = "$env:LOCALAPPDATA\Temp\empty-robo-$(Get-Date -Format 'yyyyMMddHHmmss')"
if (Test-Path $emptyDir) {
    Remove-Item -Path $emptyDir -Force -Recurse -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
Write-Host "  [OK] Empty directory created" -ForegroundColor Green

# Step 3: Use robocopy to force delete
Write-Host "[3/4] Using robocopy to force-delete locked directories..." -ForegroundColor Yellow
$easTemp = "$env:LOCALAPPDATA\Temp\eas-cli-nodejs"
if (Test-Path $easTemp) {
    Write-Host "  Found eas-cli-nodejs directory, force deleting..." -ForegroundColor Gray
    # Robocopy trick: mirror empty directory to target (deletes all contents)
    robocopy $emptyDir $easTemp /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS 2>&1 | Out-Null
    # Now remove the directory itself
    Remove-Item -Path $easTemp -Force -Recurse -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    if (-not (Test-Path $easTemp)) {
        Write-Host "  [OK] Successfully force-deleted" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] Directory still exists - may need restart" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [OK] Directory does not exist" -ForegroundColor Green
}

# Step 4: Cleanup and verify
Write-Host "[4/4] Final cleanup..." -ForegroundColor Yellow
Remove-Item -Path $emptyDir -Force -Recurse -ErrorAction SilentlyContinue

# Remove any other EAS temp patterns
$tempDir = "$env:LOCALAPPDATA\Temp"
Get-ChildItem -Path $tempDir -Filter "*eas*" -Directory -ErrorAction SilentlyContinue | 
    ForEach-Object {
        try {
            robocopy $emptyDir $_.FullName /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS 2>&1 | Out-Null
            Remove-Item -Path $_.FullName -Force -Recurse -ErrorAction SilentlyContinue
        } catch {
            # Ignore errors
        }
    }

Write-Host "  [OK] Cleanup complete" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  FORCE CLEAN COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "CRITICAL NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. CLOSE THIS TERMINAL COMPLETELY" -ForegroundColor Red
Write-Host "  2. RESTART YOUR COMPUTER (recommended)" -ForegroundColor Red
Write-Host "  3. Open a NEW terminal" -ForegroundColor Cyan
Write-Host "  4. Navigate to project" -ForegroundColor White
Write-Host "  5. Run: eas build --platform ios --profile production" -ForegroundColor White
Write-Host ""
Write-Host "If you don't restart, the error may persist due to Windows file locking." -ForegroundColor Yellow
Write-Host ""












