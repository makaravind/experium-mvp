# Current Milestone: m2b-map-migration — MapLibre + PMTiles

**GitHub:** [#16](https://github.com/makaravind/experium-ai-tour-app/milestone/16)
**Progress:** DONE — merged to main 2026-10-12

## What shipped
- `mapbox-gl` → `maplibre-gl@^4.7.1` + `pmtiles@^3.2.1`
- `park.pmtiles` (11MB) in `public/` — static asset, precacheable by m5
- `ParkMapbox.tsx` → `ParkMap.tsx` (PMTiles protocol, inline style, no Mapbox token)
- `marker-layer.ts` type imports updated
- `NEXT_PUBLIC_MAPBOX_TOKEN` removed from `.env.example`
- Issue #66 closed

## Previously current: m5-pwa-offline [#11] — 0/5 closed
- #63 PWA polish
- #64 Upfront precache (in-progress on branch impl/gh-64)
- #65 Offline first-visit fallback
- #66 Investigate Mapbox offline → **resolved by m2b-map-migration**
- #67 Offline-safe retry queue for /api/scan POSTs

## Deferred (parallel, not blocking)
- m4-gamification #62 (badge artwork) — milestone otherwise done (4/5)
