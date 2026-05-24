# 3D-Builder Unified Launcher (One-Click)
# Launches both the Python Geometry Backend and the Electron Frontend

Clear-Host
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       3D-Builder v2.0 Professional CAD             " -ForegroundColor Cyan
Write-Host "          One-Click Launcher Initializing           " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

$RootPath = "C:\Users\3kids\Downloads\3D-Builder"
$BackendPath = "$RootPath\backend"

# 1. Start Python Backend in a background process
Write-Host "[1/3] Starting Python Geometry Kernel (Port 8400)..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8400" -WorkingDirectory $BackendPath -WindowStyle Hidden

# Give backend a moment to warm up
Start-Sleep -Seconds 2

# 2. Check dependencies
Write-Host "[2/3] Verifying environment health..." -ForegroundColor Yellow
if (Test-Path "$RootPath\node_modules") {
    Write-Host "      - Node modules found." -ForegroundColor Gray
} else {
    Write-Host "      - Installing missing Node modules..." -ForegroundColor Gray
    Set-Location $RootPath
    npm install
}

# 3. Launch Electron Frontend
Write-Host "[3/3] Launching Desktop Interface..." -ForegroundColor Green
Write-Host ""
Write-Host "----------------------------------------------------" -ForegroundColor Gray
Write-Host "  Backend: Running (Hidden Process)" -ForegroundColor Gray
Write-Host "  Frontend: Initializing..." -ForegroundColor Gray
Write-Host "----------------------------------------------------" -ForegroundColor Gray
Write-Host ""

Set-Location $RootPath
npm run electron:dev
