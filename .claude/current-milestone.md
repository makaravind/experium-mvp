# Current Milestone: m5-pwa-offline — PWA + Offline

**GitHub:** [#11](https://github.com/makaravind/experium-ai-tour-app/milestone/11)
**Progress:** IN PROGRESS — 2/5 closed

## Closed
- #66 Investigate Mapbox offline options for GL JS web — resolved by m2b-map-migration, no separate build needed
- #64 Upfront precache (audio + metadata + images) — merged to main 2026-10-16 as `0a73816`
  - Shipped as app-wide `AppGate` (gates every route) + `lib/precache.ts` + `lib/handshake-lock.ts` (cross-tab visitor-id lock) + DebugPanel "No precache" toggle
  - Audio precached; app has no per-exhibit images yet (criterion doesn't apply); metadata already offline via persisted Zustand store
  - Spec: `docs/specs/gh-64-upfront-precache.md`

## Open
- #63 PWA polish: native feel + UI stress testing
- #65 Offline first-visit fallback screen
- #67 Offline-safe retry queue for `/api/scan` POSTs — real correctness gap (fire-and-forget `postScan`), not part of #64's scope

## Deferred (parallel, not blocking)
- m4-gamification #62 (badge artwork) — milestone otherwise done (4/5)
