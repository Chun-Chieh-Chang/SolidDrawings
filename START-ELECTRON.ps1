# 3D-Builder Electron 啟動腳本
# 這個腳本會自動安裝依賴並啟動 Electron 桌面應用

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  3D-Builder Electron Desktop Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Node.js 是否安裝
try {
    $nodeVersion = node --version
    Write-Host "[✓] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 檢查 npm 是否安裝
try {
    $npmVersion = npm --version
    Write-Host "[✓] npm found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] npm not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow

# 安裝根目錄依賴
Write-Host "  - Installing root dependencies..." -ForegroundColor Gray
npm install

# 安裝 Electron 依賴
Write-Host "  - Installing Electron dependencies..." -ForegroundColor Gray
cd electron
npm install

Write-Host ""
Write-Host "Step 2: Building application..." -ForegroundColor Yellow

# 建置 Next.js
Write-Host "  - Building Next.js application..." -ForegroundColor Gray
cd ..
npm run build

# 建置 Electron
Write-Host "  - Building Electron application..." -ForegroundColor Gray
cd electron
tsc --project tsconfig.json

Write-Host ""
Write-Host "Step 3: Starting Electron..." -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  3D-Builder is starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# 啟動 Electron
cd ..
npm run electron:start
