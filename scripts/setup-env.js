#!/usr/bin/env node

// TrustTentacle Environment Setup Script 🐙
// Octopus Hackathon 2025

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🐙 TrustTentacle Environment Setup');
console.log('🌊 Let\'s configure your octopus guardian for the digital ocean!\n');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('📋 We need to configure some environment variables for full functionality.\n');
  
  // Contracts configuration
  console.log('⛓️  BLOCKCHAIN CONFIGURATION');
  console.log('For testnet deployment, you need a private key with some MATIC tokens.');
  console.log('Get testnet MATIC from: https://faucet.polygon.technology/\n');
  
  const privateKey = await question('Enter your private key (without 0x prefix): ');
  const polygonRpc = await question('Polygon Amoy RPC URL (press Enter for default): ') || 'https://rpc-amoy.polygon.technology/';
  
  // API Keys
  console.log('\n🔑 API KEYS (Optional but recommended for full functionality)');
  console.log('These APIs enhance the tentacle verification capabilities:\n');
  
  const virusTotalKey = await question('VirusTotal API Key (optional): ');
  const safeBrowsingKey = await question('Google Safe Browsing API Key (optional): ');
  const shodanKey = await question('Shodan API Key (optional): ');
  
  // IPFS Configuration
  console.log('\n📦 IPFS CONFIGURATION');
  console.log('For storing phishing report metadata. You can use Infura or Pinata.\n');
  
  const ipfsUrl = await question('IPFS API URL (press Enter for Infura default): ') || 'https://ipfs.infura.io:5001';
  const ipfsKey = await question('IPFS API Key (optional): ');
  const ipfsSecret = await question('IPFS API Secret (optional): ');
  
  // Create contracts .env
  const contractsEnv = `# Blockchain Configuration
PRIVATE_KEY=${privateKey}
POLYGON_AMOY_RPC=${polygonRpc}
POLYGON_RPC=https://polygon-rpc.com/
POLYGONSCAN_API_KEY=

# Gas Reporting
REPORT_GAS=true

# Deployment
DEPLOYER_ADDRESS=
`;

  // Create backend .env
  const backendEnv = `# Server Configuration
PORT=3001
NODE_ENV=development
API_VERSION=v1

# Blockchain Configuration
POLYGON_AMOY_RPC=${polygonRpc}
POLYGON_RPC=https://polygon-rpc.com/
PRIVATE_KEY=${privateKey}

# Contract Addresses (will be populated after deployment)
ENTITY_REGISTRY_ADDRESS=
DOMAIN_REGISTRY_ADDRESS=
PHISHING_REPORTS_ADDRESS=

# External APIs
VIRUSTOTAL_API_KEY=${virusTotalKey}
GOOGLE_SAFE_BROWSING_API_KEY=${safeBrowsingKey}
SHODAN_API_KEY=${shodanKey}

# IPFS Configuration
IPFS_API_URL=${ipfsUrl}
IPFS_API_KEY=${ipfsKey}
IPFS_API_SECRET=${ipfsSecret}

# Cache Configuration
CACHE_TTL=300
CACHE_MAX_KEYS=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
JWT_SECRET=trust_tentacle_octopus_hackathon_2025_secret_key
CORS_ORIGIN=http://localhost:3000,chrome-extension://*
`;

  // Write files
  fs.writeFileSync(path.join(__dirname, '../contracts/.env'), contractsEnv);
  fs.writeFileSync(path.join(__dirname, '../backend/.env'), backendEnv);
  
  console.log('\n✅ Environment files created successfully!');
  console.log('📁 contracts/.env - Blockchain configuration');
  console.log('📁 backend/.env - API and service configuration');
  
  console.log('\n🎯 Next steps:');
  console.log('1. Get testnet MATIC: https://faucet.polygon.technology/');
  console.log('2. Run deployment: npm run deploy:testnet');
  console.log('3. Start backend: npm run backend:dev');
  console.log('4. Load extension in Chrome');
  
  console.log('\n🐙 Your octopus guardian is almost ready to swim!');
  
  rl.close();
}

// Handle errors gracefully
process.on('SIGINT', () => {
  console.log('\n\n🐙 Setup cancelled. You can run this script again anytime!');
  rl.close();
  process.exit(0);
});

setupEnvironment().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});
