<# 
    Survey Verification Platform - Bootstrap Script
    BackOffice Pro (Pty) Ltd
    
    Run this script to start the development environment.
    Usage: .\start.ps1
#>

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $ProjectRoot "frontend"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Survey Verification Platform" -ForegroundColor Cyan
Write-Host "  BackOffice Pro (Pty) Ltd" -ForegroundColor Cyan
Write-Host "  Trust Every Survey. Verify Every Transaction." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ---------------------------------------------------------------------------
# Check prerequisites
# ---------------------------------------------------------------------------
function Test-Command($cmd) {
    $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

$missing = @()
if (-not (Test-Command node))  { $missing += "Node.js (https://nodejs.org)" }
if (-not (Test-Command yarn)) { $missing += "Yarn (npm install -g yarn)" }
if (-not (Test-Command docker)) { $missing += "Docker (https://docker.com)" }

if ($missing.Count -gt 0) {
    Write-Host "  Missing prerequisites:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Install missing tools and re-run this script." -ForegroundColor Red
    exit 1
}

$nodeVer = node --version
$yarnVer = yarn --version
$dockerVer = docker --version
Write-Host "  Node.js:  $nodeVer" -ForegroundColor Green
Write-Host "  Yarn:     $yarnVer" -ForegroundColor Green
Write-Host "  Docker:   $dockerVer" -ForegroundColor Green
Write-Host ""

# ---------------------------------------------------------------------------
# Install frontend dependencies
# ---------------------------------------------------------------------------
Write-Host "[2/5] Checking frontend dependencies..." -ForegroundColor Yellow
$nodeModules = Join-Path $FrontendDir "node_modules"
if (-not (Test-Path $nodeModules) -or -not (Test-Path (Join-Path $nodeModules ".bin"))) {
    Write-Host "  Installing frontend packages (this may take a few minutes)..." -ForegroundColor Gray
    Push-Location $FrontendDir
    yarn install --network-timeout 300000 2>&1 | Out-Null
    Pop-Location
    Write-Host "  Dependencies installed." -ForegroundColor Green
} else {
    Write-Host "  Dependencies already installed." -ForegroundColor Green
}
Write-Host ""

# ---------------------------------------------------------------------------
# Start PostgreSQL + Redis via Docker Compose
# ---------------------------------------------------------------------------
Write-Host "[3/5] Starting database services (PostgreSQL + Redis)..." -ForegroundColor Yellow
$composeFile = Join-Path $ProjectRoot "docker-compose.yml"
if (Test-Path $composeFile) {
    $dbRunning = docker compose ps postgres 2>&1 | Select-String "Up"
    if (-not $dbRunning) {
        Write-Host "  Starting containers..." -ForegroundColor Gray
        docker compose up -d postgres redis 2>&1 | Out-Null
        Write-Host "  Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
    } else {
        Write-Host "  Database services already running." -ForegroundColor Green
    }
} else {
    Write-Host "  docker-compose.yml not found - skipping (app runs without DB for landing page)." -ForegroundColor Gray
}
Write-Host ""

# ---------------------------------------------------------------------------
# Start Next.js dev server
# ---------------------------------------------------------------------------
Write-Host "[4/5] Starting Next.js dev server..." -ForegroundColor Yellow

# Kill any existing Next.js dev server on port 3000
$existingProc = netstat -ano | Select-String ":3000.*LISTENING"
if ($existingProc) {
    $existingPid = ($existingProc -split "\s+")[-1]
    Write-Host "  Stopping existing process on port 3000 (PID: $existingPid)..." -ForegroundColor Gray
    Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Push-Location $FrontendDir
Start-Process -FilePath "node" -ArgumentList "node_modules\next\dist\bin\next","dev" `
    -WorkingDirectory $FrontendDir -WindowStyle Hidden
Pop-Location

Write-Host "  Waiting for server to start..." -ForegroundColor Gray
$maxWait = 30
$started = $false
for ($i = 0; $i -lt $maxWait; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $started = $true
            break
        }
    } catch {}
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
Write-Host "[5/5] Application Status" -ForegroundColor Yellow
Write-Host ""

if ($started) {
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "  Application is RUNNING!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Landing Page:    http://localhost:3000" -ForegroundColor White
    Write-Host "  Dashboard:       http://localhost:3000/dashboard" -ForegroundColor White
    Write-Host "  Login:           http://localhost:3000/auth/login" -ForegroundColor White
    Write-Host "  Register:        http://localhost:3000/auth/register" -ForegroundColor White
    Write-Host "  Surveys:         http://localhost:3000/surveys" -ForegroundColor White
    Write-Host "  Verification:    http://localhost:3000/verification" -ForegroundColor White
    Write-Host "  NFTs:            http://localhost:3000/nfts" -ForegroundColor White
    Write-Host "  Wallet:          http://localhost:3000/wallet" -ForegroundColor White
    Write-Host "  Terms:           http://localhost:3000/legal/terms" -ForegroundColor White
    Write-Host "  Privacy:         http://localhost:3000/legal/privacy" -ForegroundColor White
    Write-Host ""
    Write-Host "  Stop the server:  Stop-Process -Name node" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host "  Server may still be starting..." -ForegroundColor Yellow
    Write-Host "  Try: http://localhost:3000" -ForegroundColor Yellow
    Write-Host "=============================================" -ForegroundColor Red
}
