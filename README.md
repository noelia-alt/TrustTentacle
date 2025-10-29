# 🐙 TrustTentacle - Digital Trust Guardian

> A tentacle of trust against digital fraud  
> **Octopus Hackathon 2025 - Official Project**

TrustTentacle is an anti-phishing protection system that combines AI and blockchain to create a "guardian octopus" that protects users in real-time while navigating the digital ocean.

**🏆 Specially designed for Octopus Hackathon 2025** - where the intelligence of the octopus meets blockchain technology to create the smartest digital guardian in the ocean.

## 🌊 The Problem

Digital fraud like banking phishing grows every year. Thousands of people lose money without realizing it by clicking on fake sites or deceptive emails.

## 🐙 The Solution

TrustTentacle extends its 8 tentacles to protect you:

1. **AI Tentacle**: Detects phishing with machine learning
2. **Blockchain Tentacle**: Verifies official domains in immutable registry
3. **SSL Tentacle**: Analyzes certificates and secure connections
4. **Intel Tentacle**: Queries threat databases
5. **Community Tentacle**: Collaborative user reports
6. **Visual Tentacle**: Visual similarity analysis of sites
7. **Behavioral Tentacle**: Detects suspicious patterns
8. **Shield Tentacle**: Real-time protection

## 🏗️ Architecture

```
TrustTentacles/
├── contracts/          # Smart contracts (Solidity)
├── backend/            # API server (Node.js/Express)
├── extension/          # Chrome extension (MV3)
├── web/               # Web dashboard (React/Vite)
├── docs/              # Documentation
└── scripts/           # Deployment and utilities
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **pnpm** - Package manager (faster than npm)
- **Git** - Version control
- **MetaMask** - Wallet to interact with blockchain
- **Chrome/Edge** - For extension testing

### Installation

```bash
# Clone the repository
git clone https://github.com/noelia-alt/TrustTentacle.git
cd TrustTentacle

# Install pnpm globally if you don't have it
npm install -g pnpm

# Install all dependencies
pnpm install:all
```

### Development

```bash
# Compile smart contracts
pnpm contracts:compile

# Deploy on Polygon Amoy testnet
pnpm contracts:deploy

# Start backend API (port 3001)
pnpm backend:dev

# Build extension for development
pnpm extension:dev

# Start web dashboard
pnpm web:dev

# Run everything in parallel
pnpm dev:all
```

## 🧪 Testing

```bash
# Run all tests
pnpm test:all

# Specific tests
pnpm contracts:test    # Contract tests
pnpm backend:test      # API tests
pnpm extension:test    # Extension tests
```

## 📦 Deployment

### Testnet (Polygon Amoy)

```bash
# Complete testnet deployment
pnpm deploy:testnet
```

### Production

```bash
# Build and deploy to production
pnpm deploy:prod
```

### Useful Commands

```bash
# Clean node_modules and builds
pnpm clean

# Security audit
pnpm audit

# Format code
pnpm format

# Linting
pnpm lint
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🐙 Team

Developed with 🧠 and ☕ for **Octopus Hackathon 2025** (October 1-31, 2025).

---

## 🏆 Octopus Hackathon 2025

**"In the digital ocean, only the smartest octopus can protect you"**

TrustTentacle represents the natural evolution of the octopus concept: an intelligent, adaptable creature with multiple tentacles working in parallel. Each tentacle of our system has a specific function, but all work together for a common goal: **your digital security**.

### Why an octopus?
- **8 tentacles = 8 protection systems** working simultaneously
- **Distributed intelligence**: each tentacle can act independently
- **Adaptability**: adjusts to new threats in real-time
- **Survival**: the octopus is one of the most intelligent animals in the ocean

**"Navigate safely in the digital ocean"** 🌊🔐
