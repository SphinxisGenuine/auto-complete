# High-Concurrency VU Benchmark Runner
param (
    [string]$Type = "autocomplete", # "autocomplete", "selection", "capacity", "stress", or "all"
    [string]$BaseUrl = "http://localhost:3000"
)

$env:BASE_URL = $BaseUrl

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   AUTOCOMPLETE ENGINE - VU LOAD & CAPACITY BENCHMARK    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target: $BaseUrl" -ForegroundColor Yellow
Write-Host "Mode  : $Type" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "reports")) {
    New-Item -ItemType Directory -Path "reports" -Force | Out-Null
}

try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[✓] Target server is healthy: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "[!] Warning: Server at $BaseUrl did not respond to /health. Make sure backend is running!" -ForegroundColor Red
    Write-Host "    Start backend with: npm run dev" -ForegroundColor Gray
}

$k6Path = (Get-Command k6 -ErrorAction SilentlyContinue).Source
if (-not $k6Path) {
    Write-Host "[!] k6 is not found in PATH." -ForegroundColor Red
    exit 1
}

# Ensure TypeScript build is up to date
Write-Host "Building TypeScript to dist..." -ForegroundColor Gray
npm run build --silent

function Run-Test([string]$scriptName, [string]$label) {
    Write-Host "`n>>> Running $label (dist/load-tests/$scriptName)..." -ForegroundColor Magenta
    k6 run "dist/load-tests/$scriptName"
}

switch ($Type.ToLower()) {
    "autocomplete" {
        Run-Test "autocomplete-vu-test.js" "Autocomplete VU Latency Test"
    }
    "selection" {
        Run-Test "selection-vu-test.js" "Selection Recording VU Test"
    }
    "capacity" {
        Run-Test "mixed-capacity-test.js" "Whole Application Mixed VU Capacity Test"
    }
    "stress" {
        Run-Test "stress-capacity-test.js" "Stress & Saturation Limit Test"
    }
    "all" {
        Run-Test "autocomplete-vu-test.js" "Autocomplete VU Latency Test"
        Run-Test "selection-vu-test.js" "Selection Recording VU Test"
        Run-Test "mixed-capacity-test.js" "Whole Application Mixed VU Capacity Test"
    }
    default {
        Write-Host "Unknown type: $Type. Valid options: autocomplete, selection, capacity, stress, all" -ForegroundColor Red
    }
}
