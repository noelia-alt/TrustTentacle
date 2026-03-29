# TrustTentacle

> Real-time anti-phishing protection for everyday browsing  
> Stage 2 finalist: **Top 50 project** in Octopus Hackathon: season 1 (2025)

TrustTentacle is a browser-based digital trust layer designed to reduce phishing, impersonation, and social engineering risk before a user is compromised. It combines a Chrome extension, a verification backend, a monitoring dashboard, and an optional blockchain registry architecture to deliver proactive protection instead of reactive cleanup.

## The Problem

Phishing attacks no longer depend on crude fake pages. Modern campaigns rely on domain impersonation, social engineering, cloned login experiences, and short-lived infrastructure that can fool users before traditional blacklists react.

For users and organizations, this creates a clear gap:

- Too much trust is placed on the browser alone
- Detection often happens after credentials or payments are already compromised
- Legitimate domains are hard to verify in real time
- Reporting and threat sharing are fragmented

## The Solution

TrustTentacle adds a real-time verification layer to browsing.

When a user visits a page, the system evaluates the URL and page context through multiple signals, then returns a simple decision: safe, suspicious, dangerous, or unverified.

The current MVP focuses on a realistic Stage 2 scope:

- **Browser protection** through a Chrome extension
- **Heuristic risk analysis** for suspicious URLs and phishing indicators
- **Official-domain verification** through a trusted registry model
- **Community reporting** for suspicious pages and links
- **Dashboard visibility** for activity and threat trends

## Core MVP

### What works today

- Chrome extension with popup, context menu actions, notifications, and live site checks
- Backend API for verification, reporting, stats, entities, domains, and threat activity
- Web dashboard for protection metrics and recent activity
- Demo-ready official domain verification flow
- Community phishing report submission flow
- Health status and graceful fallback when the backend is offline
- Optional smart contracts included in the repo for registry-based verification architecture

### MVP positioning

For the current MVP, TrustTentacle is presented as a **preventive anti-phishing control** with a browser-first experience and a modular trust engine behind it.

Instead of claiming a fully decentralized production security stack, this Stage 2 version proves the most important thing:  
**the user can be warned or protected during navigation, before trust is misplaced.**

## Architecture

> Place your architecture image at `docs/architecture-stage2.png` or update the path below.

![TrustTentacle Architecture](docs/architecture-stage2.png)

### High-level flow

1. The user navigates to a page in the browser
2. The Chrome extension captures the current URL and triggers verification
3. The backend evaluates the request using multiple trust signals
4. The decision engine returns a verdict
5. The extension shows the result and allows reporting if needed
6. The dashboard surfaces verification and reporting activity

### Main components

- **Chrome Extension**
  - Popup UI
  - Context menu actions
  - Notifications
  - Content script protection cues
- **Backend API**
  - URL verification
  - Community reports
  - Threat and stats endpoints
  - Optional external threat-intel integrations
- **Web Dashboard**
  - Activity trends
  - Protection metrics
  - Threat visibility
- **Smart Contracts**
  - Domain registry
  - Entity registry
  - Phishing reports contract
  - Polygon Amoy-ready architecture

## Tech Stack

### Frontend
- React
- Vite
- Recharts
- Tailwind CSS

### Extension
- Chrome Extension Manifest V3
- JavaScript
- Webpack

### Backend
- Node.js
- Express
- Axios
- Express Validator
- Helmet
- CORS
- Rate limiting

### Blockchain
- Solidity
- Hardhat
- Ethers.js
- Polygon Amoy

### Supporting Services
- IPFS mock/local demo flow
- VirusTotal integration support
- Google Safe Browsing integration support
- Shodan integration support

## Repository Structure

```text
TrustTentacles/
├── backend/      # Node.js / Express verification API
├── contracts/    # Solidity smart contracts and deployment scripts
├── extension/    # Chrome extension (MV3)
├── web/          # React / Vite dashboard
├── scripts/      # Setup and deployment helpers
├── QUICKSTART.md
└── TESTING.md
