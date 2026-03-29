Write-Host ""
Write-Host "TrustTentacle demo launcher" -ForegroundColor Cyan
Write-Host "Starting backend and web for local Stage 2 demo..." -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Stopping old Node processes (best effort)..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host "[2/3] Starting backend on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd D:\TrustTentacles; pnpm backend:dev"
)
Start-Sleep -Seconds 3

Write-Host "[3/3] Starting web dashboard (Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd D:\TrustTentacles; pnpm web:dev"
)
Start-Sleep -Seconds 4

Write-Host ""
Write-Host "Expected URLs" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001/health"
Write-Host "Web:      http://localhost:5173"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1) Build extension: pnpm extension:build"
Write-Host "2) Load unpacked from extension/dist"
Write-Host "3) Run checks: pnpm demo:check"
