#!/usr/bin/env pwsh
# run-tests.ps1 — Run Python pytest + TypeScript typecheck and report results.
# Usage: pwsh ./scripts/run-tests.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$passCount = 0
$failCount = 0
$totalCount = 0

function Write-Section($title) {
    Write-Host ""
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host " $title" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
}

# ── 1. Run pytest on backend/tests ───────────────────────────────
Write-Section "Python Tests (pytest)"

$pytestResult = Invoke-Expression "uv run --directory $root/backend pytest $root/backend/tests --tb=short -q 2>&1"
$pytestLines = $pytestResult -split "`n" | Where-Object { $_.Trim() }

# Collect summary line (last line typically shows X passed, Y failed, etc.)
$summaryLine = $pytestLines | Where-Object { $_ -match '\d+ passed|\d+ failed|error' } | Select-Object -Last 1

if ($pytestLines -match "failed|error") {
    Write-Host "FAIL — Python tests had failures/errors." -ForegroundColor Red
    $failCount++
} elseif ($pytestLines -match "passed" -and $pytestLines -match "0 failed") {
    Write-Host "PASS — All Python tests passed." -ForegroundColor Green
    $passCount++
} else {
    # Fallback: check exit code via uv
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
        Write-Host "PASS — All Python tests passed." -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "FAIL — Python tests exited with code $exitCode" -ForegroundColor Red
        $failCount++
    }
}

foreach ($line in $pytestLines) {
    Write-Host "  $line"
}

# ── 2. TypeScript type check ─────────────────────────────────────
Write-Section "TypeScript Type Check"

$npxCmd = "npx tsc --noEmit"
try {
    Invoke-Expression "$npxCmd 2>&1" | Out-Null
    Write-Host "PASS — TypeScript type check succeeded." -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "FAIL — TypeScript type check failed." -ForegroundColor Red
    $failCount++
    Write-Host $_.Exception.Message
}

# ── Summary ──────────────────────────────────────────────────────
$totalCount = $passCount + $failCount
Write-Host ""
Write-Host "================================" -ForegroundColor White
Write-Host " Test Summary" -ForegroundColor White
Write-Host "================================" -ForegroundColor White
Write-Host " Total : $totalCount" -ForegroundColor White
Write-Host " Passed: $passCount" -ForegroundColor Green
Write-Host " Failed: $failCount" -ForegroundColor Red
Write-Host "================================" -ForegroundColor White

if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "RESULT: SOME TESTS FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "RESULT: ALL TESTS PASSED" -ForegroundColor Green
    exit 0
}
