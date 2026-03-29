Param(
  [switch]$Quick,
  [switch]$Full
)

function Print-Result {
  Param([string]$Name, [bool]$Ok, [string]$Details = "")
  if ($Ok) {
    Write-Host "[OK]   $Name" -ForegroundColor Green
  } else {
    Write-Host "[FAIL] $Name" -ForegroundColor Red
  }
  if ($Details) { Write-Host "       $Details" -ForegroundColor Gray }
}

function Test-Health {
  try {
    $r = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
    Print-Result "Backend health" ($r.status -eq "healthy") ("status=" + $r.status)
    return $true
  } catch {
    Print-Result "Backend health" $false "Backend is not responding on :3001"
    return $false
  }
}

function Test-VerifyEndpoints {
  $safeBody = @{ url = "https://bancogalicia.com.ar" } | ConvertTo-Json
  $riskBody = @{ url = "https://paypa1-secure.tk/login" } | ConvertTo-Json

  try {
    $safe = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/verify" -Method Post -ContentType "application/json" -Body $safeBody -TimeoutSec 10
    Print-Result "Verify safe URL" ($safe.verdict -ne $null) ("verdict=" + $safe.verdict)
  } catch {
    Print-Result "Verify safe URL" $false "Request failed"
  }

  try {
    $risk = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/verify" -Method Post -ContentType "application/json" -Body $riskBody -TimeoutSec 10
    $ok = $risk.verdict -eq "SUSPICIOUS" -or $risk.verdict -eq "DANGEROUS"
    Print-Result "Verify suspicious URL" $ok ("verdict=" + $risk.verdict)
  } catch {
    Print-Result "Verify suspicious URL" $false "Request failed"
  }
}

function Test-ReportAndStats {
  $body = @{
    url = "https://evil-login-example.tk"
    description = "Smoke test report from scripts/test.ps1"
    category = "phishing"
    evidence = @{
      source = "smoke_test"
      timestamp = (Get-Date).ToString("o")
    }
  } | ConvertTo-Json -Depth 5

  try {
    $rep = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/report" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 10
    Print-Result "Submit report" ($rep.success -eq $true) ("reportId=" + $rep.reportId)
  } catch {
    Print-Result "Submit report" $false "Request failed"
  }

  try {
    $s1 = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/report/stats" -Method Get -TimeoutSec 10
    Print-Result "Report stats" ($s1.totalReports -ge 0) ("total=" + $s1.totalReports)
  } catch {
    Print-Result "Report stats" $false "Request failed"
  }

  try {
    $s2 = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/stats/activity?days=7" -Method Get -TimeoutSec 10
    $ok = $s2.series -ne $null -and $s2.series.Count -gt 0
    Print-Result "Activity stats" $ok ("points=" + $s2.series.Count)
  } catch {
    Print-Result "Activity stats" $false "Request failed"
  }
}

function Test-ExtensionBuildArtifacts {
  $dist = "extension\dist"
  if (-not (Test-Path $dist)) {
    Print-Result "Extension build artifacts" $false "Run 'pnpm extension:build'"
    return
  }
  $manifestOk = Test-Path "$dist\manifest.json"
  $popupOk = Test-Path "$dist\popup.html"
  $bgOk = Test-Path "$dist\background.js"
  Print-Result "Extension build artifacts" ($manifestOk -and $popupOk -and $bgOk)
}

Write-Host ""
Write-Host "TrustTentacle smoke test" -ForegroundColor Cyan
Write-Host ""

$healthy = Test-Health
if ($healthy) {
  Test-VerifyEndpoints
  Test-ReportAndStats
}
Test-ExtensionBuildArtifacts

if ($Full) {
  try {
    $u = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/stats" -Method Get -TimeoutSec 10
    Print-Result "Global stats endpoint" ($u.system -ne $null)
  } catch {
    Print-Result "Global stats endpoint" $false "Request failed"
  }
}

Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
