# TrustTentacle Quick Start

This quick start is optimized for a stable local Stage 2 demo.

## Prerequisites

- Node.js 18+
- pnpm
- Chrome or Edge

## 1) Install dependencies

```bash
pnpm install:all
```

## 2) Configure environment files

```bash
cp backend/.env.example backend/.env
cp contracts/.env.example contracts/.env
cp web/.env.example web/.env
```

For local demo keep:

- `backend` on port `3001`
- `web` API base as `http://localhost:3001/api/v1`

## 3) Start backend

```bash
pnpm backend:dev
```

Health check:

```text
http://localhost:3001/health
```

## 4) Start web dashboard

```bash
pnpm web:dev
```

Default URL:

```text
http://localhost:5173
```

## 5) Build and load extension

```bash
pnpm extension:build
```

Then:

1. Open `chrome://extensions/`
2. Enable Developer Mode
3. `Load unpacked`
4. Select `extension/dist`

## 6) Demo happy path

1. Verify a known safe URL.
2. Verify a suspicious URL.
3. Submit a phishing report.
4. Show dashboard activity.

## Useful commands

```bash
pnpm demo:start
pnpm demo:check
```
