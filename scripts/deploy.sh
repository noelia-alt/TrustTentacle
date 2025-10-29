#!/bin/bash

# TrustTentacle Deployment Script 🐙
# Octopus Hackathon 2025

set -e

echo "🐙 TrustTentacle Deployment Starting..."
echo "🌊 Preparing the digital ocean for our octopus guardian..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🐙 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install it first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "contracts" ]; then
    print_error "Please run this script from the TrustTentacles root directory"
    exit 1
fi

print_status "Installing dependencies..."
pnpm install:all

print_status "Checking environment configuration..."

# Check if .env files exist
if [ ! -f "contracts/.env" ]; then
    print_warning "contracts/.env not found. Creating from template..."
    cp contracts/.env.example contracts/.env
    print_warning "Please edit contracts/.env with your private key and RPC URLs"
fi

if [ ! -f "backend/.env" ]; then
    print_warning "backend/.env not found. Creating from template..."
    cp backend/.env.example backend/.env
    print_warning "Please edit backend/.env with your API keys"
fi

# Compile contracts
print_status "Compiling smart contracts..."
pnpm contracts:compile
print_success "Smart contracts compiled"

# Deploy to testnet
print_status "Deploying contracts to Polygon Amoy testnet..."
if pnpm contracts:deploy; then
    print_success "Contracts deployed successfully!"
    
    # Extract contract addresses from deployment
    if [ -f "contracts/deployments/amoy.json" ]; then
        print_status "Updating backend configuration with contract addresses..."
        
        # Read contract addresses
        ENTITY_REGISTRY=$(node -p "require('./contracts/deployments/amoy.json').contracts.EntityRegistry")
        DOMAIN_REGISTRY=$(node -p "require('./contracts/deployments/amoy.json').contracts.DomainRegistry")
        PHISHING_REPORTS=$(node -p "require('./contracts/deployments/amoy.json').contracts.PhishingReports")
        
        # Update backend .env
        sed -i "s/ENTITY_REGISTRY_ADDRESS=.*/ENTITY_REGISTRY_ADDRESS=$ENTITY_REGISTRY/" backend/.env
        sed -i "s/DOMAIN_REGISTRY_ADDRESS=.*/DOMAIN_REGISTRY_ADDRESS=$DOMAIN_REGISTRY/" backend/.env
        sed -i "s/PHISHING_REPORTS_ADDRESS=.*/PHISHING_REPORTS_ADDRESS=$PHISHING_REPORTS/" backend/.env
        
        print_success "Backend configuration updated with contract addresses"
    fi
else
    print_error "Contract deployment failed. Please check your configuration."
    exit 1
fi

# Build extension
print_status "Building Chrome extension..."
pnpm extension:build
print_success "Extension built successfully"

# Start backend in background for testing
print_status "Starting backend server..."
cd backend
pnpm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Test backend health
print_status "Testing backend connectivity..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend is running and healthy"
else
    print_error "Backend health check failed"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Test blockchain connectivity
print_status "Testing blockchain connectivity..."
if curl -f -X POST http://localhost:3001/api/v1/verify -H "Content-Type: application/json" -d '{"url":"https://bancogalicia.com.ar"}' > /dev/null 2>&1; then
    print_success "Blockchain integration working"
else
    print_warning "Blockchain integration test failed (this might be expected if APIs are not configured)"
fi

# Stop backend
kill $BACKEND_PID 2>/dev/null || true

print_success "🎉 TrustTentacle deployment completed!"
echo ""
echo "🐙 Your octopus guardian is ready to protect the digital ocean!"
echo ""
echo "📋 Next steps:"
echo "1. Start the backend: pnpm backend:dev"
echo "2. Load the extension in Chrome from: extension/dist/"
echo "3. Configure API keys in backend/.env for full functionality"
echo ""
echo "🌊 Contract addresses saved in: contracts/deployments/amoy.json"
echo "🔗 Backend will run on: http://localhost:3001"
echo ""
echo "🏆 Ready for Octopus Hackathon 2025 demo!"
