# TrustTentacle Testing Guide

This guide covers the minimum checks required before a live demo or submission.

## Automated smoke checks

Run:

```bash
pnpm demo:check
```

The script validates:

- Backend health endpoint
- Verify endpoint response
- Report flow response
- Stats and activity endpoints
- Extension build artifacts

## Manual checks

## Backend

1. Open `http://localhost:3001/health` and confirm status is healthy.
2. Send `POST /api/v1/verify` for:
- a known official domain (expect `SAFE`)
- a suspicious URL (expect `SUSPICIOUS` or `DANGEROUS`)
3. Send `POST /api/v1/report` and confirm response contains `success: true`.
4. Check:
- `GET /api/v1/report/stats`
- `GET /api/v1/stats/activity?days=7`

## Web

1. Open `http://localhost:5173`.
2. Confirm dashboard loads with no network errors.
3. Confirm activity chart consumes backend data.
4. Confirm Decision Helper can call verify endpoint.

## Extension

1. Build extension: `pnpm extension:build`.
2. Load unpacked from `extension/dist`.
3. From popup:
- Check current site
- Report phishing
4. From context menu:
- Check link/page
- Report link/page
5. Confirm counters increase and notifications appear.

## Required screenshots for docs

Store in `docs/screenshots/`:

- `extension-popup-safe.png`
- `extension-popup-danger.png`
- `web-dashboard-overview.png`
- `web-decision-helper.png`
- `web-threat-map.png`
