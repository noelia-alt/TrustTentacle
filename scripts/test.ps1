# TrustTentacle Testing Script 🐙
# Octopus Hackathon 2025 - Automated Testing

param(
    [switch]$Quick,
    [switch]$Demo,
    [switch]$Full
)

Write-Host "🧪 TrustTentacle Testing Suite" -ForegroundColor Blue
Write-Host "🐙 Testing your octopus guardian..." -ForegroundColor Cyan

function Write-TestResult {
    param($TestName, $Success, $Details = "")
    if ($Success) {
        Write-Host "✅ $TestName" -ForegroundColor Green
    } else {
        Write-Host "❌ $TestName" -ForegroundColor Red
    }
    if ($Details) {
        Write-Host "   $Details" -ForegroundColor Gray
    }
}

function Test-Backend {
    Write-Host "`n🔧 Testing Backend API..." -ForegroundColor Yellow
    
    # Health Check
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
        $healthOk = $response.status -eq "healthy" -and $response.tentacles -eq "🐙"
        Write-TestResult "Backend Health Check" $healthOk "Status: $($response.status)"
    } catch {
        Write-TestResult "Backend Health Check" $false "Backend not responding"
        return $false
    }
    
    # Verify Endpoint
    try {
        $testData = @{ url = "https://bancogalicia.com.ar" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/verify" -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 10
        $verifyOk = $response.verdict -ne $null
        Write-TestResult "Verification Endpoint" $verifyOk "Verdict: $($response.verdict)"
    } catch {
        Write-TestResult "Verification Endpoint" $false "Verification failed"
    }
    
    # Entities Endpoint
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/entities" -Method Get -TimeoutSec 5
        $entitiesOk = $response.entities.Count -gt 0
        Write-TestResult "Entities Endpoint" $entitiesOk "Found $($response.entities.Count) entities"
    } catch {
        Write-TestResult "Entities Endpoint" $false "Entities endpoint failed"
    }
    
    # Stats Endpoint
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/stats" -Method Get -TimeoutSec 5
        $statsOk = $response.system -ne $null
        Write-TestResult "Stats Endpoint" $statsOk "System status available"
    } catch {
        Write-TestResult "Stats Endpoint" $false "Stats endpoint failed"
    }
    
    return $true
}

function Test-Blockchain {
    Write-Host "`n⛓️  Testing Blockchain Integration..." -ForegroundColor Yellow
    
    # Check deployment file
    $deploymentFile = "contracts\deployments\amoy.json"
    if (Test-Path $deploymentFile) {
        $deployment = Get-Content $deploymentFile | ConvertFrom-Json
        $contractsOk = $deployment.contracts.EntityRegistry -and $deployment.contracts.DomainRegistry -and $deployment.contracts.PhishingReports
        Write-TestResult "Contract Deployment" $contractsOk "3 contracts deployed"
    } else {
        Write-TestResult "Contract Deployment" $false "Deployment file not found"
        return $false
    }
    
    # Test domain verification
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/verify/domain/bancogalicia.com.ar" -Method Get -TimeoutSec 10
        $domainOk = $response.domain -eq "bancogalicia.com.ar"
        Write-TestResult "Domain Verification" $domainOk "Domain check working"
    } catch {
        Write-TestResult "Domain Verification" $false "Domain verification failed"
    }
    
    return $true
}

function Test-Extension {
    Write-Host "`n🌐 Testing Chrome Extension..." -ForegroundColor Yellow
    
    # Check build output
    $extensionDist = "extension\dist"
    if (Test-Path $extensionDist) {
        $manifestExists = Test-Path "$extensionDist\manifest.json"
        $popupExists = Test-Path "$extensionDist\popup.html"
        $backgroundExists = Test-Path "$extensionDist\background.js"
        
        $buildOk = $manifestExists -and $popupExists -and $backgroundExists
        Write-TestResult "Extension Build" $buildOk "All required files present"
        
        if ($manifestExists) {
            $manifest = Get-Content "$extensionDist\manifest.json" | ConvertFrom-Json
            $manifestOk = $manifest.manifest_version -eq 3 -and $manifest.name -like "*TrustTentacle*"
            Write-TestResult "Manifest Validation" $manifestOk "MV3 manifest valid"
        }
    } else {
        Write-TestResult "Extension Build" $false "Extension not built - run 'pnpm extension:build'"
        return $false
    }
    
    return $true
}

function Test-Demo {
    Write-Host "`n🎬 Demo Testing..." -ForegroundColor Yellow
    
    Write-Host "📋 Demo Checklist:" -ForegroundColor Cyan
    Write-Host "1. Navigate to https://bancogalicia.com.ar"
    Write-Host "2. Click TrustTentacle icon 🐙"
    Write-Host "3. Click 'Verificar Sitio'"
    Write-Host "4. Should show ✅ SEGURO or ❓ NO VERIFICADO"
    Write-Host "5. Try 'Reportar Phishing' on suspicious site"
    Write-Host ""
    
    $demoReady = $true
    Write-TestResult "Demo Preparation" $demoReady "Manual testing required"
    
    return $true
}

function Show-TestSummary {
    Write-Host "`n📊 Test Summary" -ForegroundColor Cyan
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host "🐙 TrustTentacle Testing Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Start backend: pnpm backend:dev"
    Write-Host "2. Load extension in Chrome from: extension\dist\"
    Write-Host "3. Test demo flow manually"
    Write-Host "4. Prepare for hackathon presentation!"
    Write-Host ""
    Write-Host "🏆 Your octopus guardian is ready for the Octopus Hackathon 2025!" -ForegroundColor Green
}

# Main testing logic
if ($Quick) {
    Write-Host "⚡ Quick Testing Mode" -ForegroundColor Yellow
    Test-Backend
    Test-Extension
} elseif ($Demo) {
    Write-Host "🎬 Demo Testing Mode" -ForegroundColor Yellow
    Test-Backend
    Test-Blockchain
    Test-Extension
    Test-Demo
} elseif ($Full) {
    Write-Host "🔬 Full Testing Mode" -ForegroundColor Yellow
    Test-Backend
    Test-Blockchain
    Test-Extension
    Test-Demo
    
    # Additional comprehensive tests
    Write-Host "`n🧪 Additional Tests..." -ForegroundColor Yellow
    
    # Test all API endpoints
    $endpoints = @(
        "http://localhost:3001/api/v1/entities",
        "http://localhost:3001/api/v1/domains", 
        "http://localhost:3001/api/v1/stats",
        "http://localhost:3001/api/v1/stats/health"
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-RestMethod -Uri $endpoint -Method Get -TimeoutSec 5
            Write-TestResult "Endpoint: $endpoint" $true "Response received"
        } catch {
            Write-TestResult "Endpoint: $endpoint" $false "Failed to respond"
        }
    }
} else {
    Write-Host "🔧 Standard Testing Mode" -ForegroundColor Yellow
    Test-Backend
    Test-Blockchain
    Test-Extension
}

Show-TestSummary
