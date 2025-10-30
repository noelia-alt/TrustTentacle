Param(
  [switch]$Quick,
  [switch]$Demo,
  [switch]$Full
)

function Write-TestResult {
  Param($Name, $Ok, $Details = "")
  if ($Ok) {
    Write-Host "[OK] $Name" -ForegroundColor Green
  } else {
    Write-Host "[FAIL] $Name" -ForegroundColor Red
  }
  if ($Details) { Write-Host "  $Details" -ForegroundColor Gray }
}

function Test-Backend {
  Write-Host "\nBackend API" -ForegroundColor Yellow

  try {
    $r = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
    $ok = $r.status -eq "healthy" -and $r.tentacles -eq "TT"
    Write-TestResult "Health" $ok "status=$($r.status); tentacles=$($r.tentacles)"
  } catch { Write-TestResult "Health" $false "Backend not responding"; return $false }

  try {
    $body = @{ url = "https://bancogalicia.com.ar" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/verify" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 10
    $ok = $r.verdict -ne $null
    Write-TestResult "Verify" $ok "verdict=$($r.verdict)"
  } catch { Write-TestResult "Verify" $false "Verification failed" }

  try {
    $r = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/entities" -Method Get -TimeoutSec 5
    $ok = $r.entities.Count -gt 0
    Write-TestResult "Entities" $ok "count=$($r.entities.Count)"
  } catch { Write-TestResult "Entities" $false "Request failed" }

  try {
    $r = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/stats" -Method Get -TimeoutSec 5
    $ok = $r.system -ne $null
    Write-TestResult "Stats" $ok "system present"
  } catch { Write-TestResult "Stats" $false "Request failed" }

  return $true
}

function Test-Blockchain {
  Write-Host "\nBlockchain (mock)" -ForegroundColor Yellow
  $deploymentFile = "contracts\deployments\amoy.json"
  if (Test-Path $deploymentFile) {
    $deployment = Get-Content $deploymentFile | ConvertFrom-Json
    $ok = $deployment.contracts.EntityRegistry -and $deployment.contracts.DomainRegistry -and $deployment.contracts.PhishingReports
    Write-TestResult "Deployment" $ok "3 contracts present"
  } else {
    Write-TestResult "Deployment" $true "skipped: deployments/amoy.json not found"
  }

  try {
    $r = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/blockchain/verify/bancogalicia.com.ar" -Method Get -TimeoutSec 10
    $ok = ($r.success -eq $true) -and ($r.domain -eq "bancogalicia.com.ar")
    Write-TestResult "Domain verify" $ok "domain=$($r.domain)"
  } catch { Write-TestResult "Domain verify" $false "Request failed" }
}

function Test-Extension {
  Write-Host "\nExtension build" -ForegroundColor Yellow
  $dist = "extension\dist"
  if (-not (Test-Path $dist)) { Write-TestResult "Build output" $false "Run 'pnpm extension:build'"; return $false }
  $manifestOk = Test-Path (Join-Path $dist 'manifest.json')
  $popupOk = Test-Path (Join-Path $dist 'popup.html')
  $bgOk = Test-Path (Join-Path $dist 'background.js')
  Write-TestResult "Required files" ($manifestOk -and $popupOk -and $bgOk)
  if ($manifestOk) {
    $m = Get-Content (Join-Path $dist 'manifest.json') | ConvertFrom-Json
    Write-TestResult "Manifest MV3" ($m.manifest_version -eq 3)
  }
}

function Test-Demo {
  Write-Host "\nDemo checklist" -ForegroundColor Yellow
  Write-Host "1) Open https://bancogalicia.com.ar"
  Write-Host "2) Click TrustTentacle icon"
  Write-Host "3) Click 'Verificar Sitio'"
  Write-Host "4) Expect SAFE or UNVERIFIED"
  Write-TestResult "Demo prep" $true "Manual steps"
}

function Show-TestSummary {
  Write-Host "\nTest Summary" -ForegroundColor Cyan
  Write-Host "TrustTentacle testing complete" -ForegroundColor Green
  Write-Host "Next steps:" -ForegroundColor Yellow
  Write-Host "1) Start backend: pnpm backend:dev"
  Write-Host "2) Load extension from extension\\dist"
  Write-Host "3) Test demo flow"
}

if ($Quick) {
  Test-Backend | Out-Null
  Test-Extension | Out-Null
} elseif ($Demo) {
  Test-Backend | Out-Null
  Test-Blockchain | Out-Null
  Test-Extension | Out-Null
  Test-Demo | Out-Null
} elseif ($Full) {
  Test-Backend | Out-Null
  Test-Blockchain | Out-Null
  Test-Extension | Out-Null
  Test-Demo | Out-Null
  $endpoints = @(
    "http://localhost:3001/api/v1/entities",
    "http://localhost:3001/api/v1/domains",
    "http://localhost:3001/api/v1/stats",
    "http://localhost:3001/api/v1/stats/health"
  )
  foreach ($ep in $endpoints) {
    try { $r = Invoke-RestMethod -Uri $ep -Method Get -TimeoutSec 5; Write-TestResult "Endpoint $ep" $true }
    catch { Write-TestResult "Endpoint $ep" $false }
  }
} else {
  Test-Backend | Out-Null
  Test-Blockchain | Out-Null
  Test-Extension | Out-Null
}

Show-TestSummary
