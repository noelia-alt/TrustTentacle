# TrustTentacle Extension Install Guide

## Build

From repository root:

```bash
pnpm extension:build
```

## Load in Chrome

1. Open `chrome://extensions/`
2. Enable Developer Mode
3. Click `Load unpacked`
4. Select `extension/dist`

## Quick functional check

1. Open any site.
2. Open TrustTentacle popup.
3. Click `Check Site`.
4. Submit a report from popup or context menu.
5. Confirm counters update in popup.

## Troubleshooting

- Backend must be running on `http://localhost:3001`.
- If popup fails, reload extension from `chrome://extensions/`.
- If build output is missing, run `pnpm extension:build` again.
