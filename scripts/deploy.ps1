# TrustTentacle Deployment Script for Windows 🐙
# Octopus Hackathon 2025

param(
    [switch]$SkipDeps,
    [switch]$TestOnly
)

Write-Host "🐙 TrustTentacle Deployment Starting..." -ForegroundColor Blue
Write-Host "🌊 Preparing the digital ocean for our octopus guardian..." -ForegroundColor Cyan

function Write-Status {
    param($Message)
    Write-Host "🐙 $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if pnpm is installed
try {
    pnpm --version | Out-Null
} catch {
    Write-Error "pnpm is not installed. Please install it first:"
    Write-Host "npm install -g pnpm"
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "package.json") -or -not (Test-Path "contracts")) {
    Write-Error "Please run this script from the TrustTentacles root directory"
    exit 1
}

if (-not $SkipDeps) {
    Write-Status "Installing dependencies..."
    pnpm install:all
}

Write-Status "Checking environment configuration..."

# Check if .env files exist
if (-not (Test-Path "contracts\.env")) {
    Write-Warning "contracts\.env not found. Creating from template..."
    Copy-Item "contracts\.env.example" "contracts\.env"
    Write-Warning "Please edit contracts\.env with your private key and RPC URLs"
}

if (-not (Test-Path "backend\.env")) {
    Write-Warning "backend\.env not found. Creating from template..."
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Warning "Please edit backend\.env with your API keys"
}

if ($TestOnly) {
    Write-Status "Running in test mode - skipping deployment"
} else {
    # Compile contracts
    Write-Status "Compiling smart contracts..."
    try {
        pnpm contracts:compile
        Write-Success "Smart contracts compiled"
    } catch {
        Write-Error "Contract compilation failed"
        exit 1
    }

    # Deploy to testnet
    Write-Status "Deploying contracts to Polygon Amoy testnet..."
    try {
        pnpm contracts:deploy
        Write-Success "Contracts deployed successfully!"
        
        # Update backend configuration with contract addresses
        if (Test-Path "contracts\deployments\amoy.json") {
            Write-Status "Updating backend configuration with contract addresses..."
            
            $deployment = Get-Content "contracts\deployments\amoy.json" | ConvertFrom-Json
            $entityRegistry = $deployment.contracts.EntityRegistry
            $domainRegistry = $deployment.contracts.DomainRegistry
            $phishingReports = $deployment.contracts.PhishingReports
            
            # Update backend .env
            $envContent = Get-Content "backend\.env"
            $envContent = $envContent -replace "ENTITY_REGISTRY_ADDRESS=.*", "ENTITY_REGISTRY_ADDRESS=$entityRegistry"
            $envContent = $envContent -replace "DOMAIN_REGISTRY_ADDRESS=.*", "DOMAIN_REGISTRY_ADDRESS=$domainRegistry"
            $envContent = $envContent -replace "PHISHING_REPORTS_ADDRESS=.*", "PHISHING_REPORTS_ADDRESS=$phishingReports"
            $envContent | Set-Content "backend\.env"
            
            Write-Success "Backend configuration updated with contract addresses"
        }
    } catch {
        Write-Error "Contract deployment failed. Please check your configuration."
        exit 1
    }
}

# Build extension
Write-Status "Building Chrome extension..."
try {
    pnpm extension:build
    Write-Success "Extension built successfully"
} catch {
    Write-Error "Extension build failed"
    exit 1
}

# Test backend startup
Write-Status "Testing backend startup..."
try {
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        Set-Location backend
        pnpm start
    }
    
    Start-Sleep -Seconds 8
    
    # Test backend health
    Write-Status "Testing backend connectivity..."
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
        Write-Success "Backend is running and healthy"
        
        # Test blockchain connectivity
        Write-Status "Testing blockchain connectivity..."
        try {
            $testData = @{
                url = "https://bancogalicia.com.ar"
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/verify" -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 10
            Write-Success "Blockchain integration working"
        } catch {
            Write-Warning "Blockchain integration test failed (this might be expected if APIs are not configured)"
        }
    } catch {
        Write-Warning "Backend health check failed - this is normal if environment is not fully configured"
    }
    
    # Stop the test backend
    Stop-Job $job -PassThru | Remove-Job
} catch {
    Write-Warning "Backend test failed - this is normal for initial setup"
}

Write-Success "🎉 TrustTentacle deployment completed!"
Write-Host ""
Write-Host "🐙 Your octopus guardian is ready to protect the digital ocean!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend: pnpm backend:dev"
Write-Host "2. Load the extension in Chrome from: extension\dist\"
Write-Host "3. Configure API keys in backend\.env for full functionality"
Write-Host ""
Write-Host "🌊 Contract addresses saved in: contracts\deployments\amoy.json" -ForegroundColor Cyan
Write-Host "🔗 Backend will run on: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "🏆 Ready for Octopus Hackathon 2025 demo!" -ForegroundColor Green
