# Current Milestone: m5-pwa-offline — PWA + Offline

**GitHub:** [#11](https://github.com/makaravind/experium-ai-tour-app/milestone/11)
**Progress:** IN PROGRESS — 3/9 closed

## Closed
- #66 Investigate Mapbox offline options for GL JS web — resolved by m2b-map-migration, no separate build needed
- #64 Upfront precache (audio + metadata + images) — merged to main 2026-10-16 as `0a73816`
  - Shipped as app-wide `AppGate` (gates every route) + `lib/precache.ts` + `lib/handshake-lock.ts` (cross-tab visitor-id lock) + DebugPanel "No precache" toggle
  - Audio precached; app has no per-exhibit images yet (criterion doesn't apply); metadata already offline via persisted Zustand store
  - Spec: `docs/specs/gh-64-upfront-precache.md`
- #77 Language switch after precache — merged to main 2026-10-17 as `48d6881`
  - Precache covers only the onboarding language (`precacheLanguage`); sheet chips stream other languages online and never re-gate; sheet lists every published language
  - Failed/missing language reverts to `precacheLanguage` + toast (8s start timeout); store v1 migration drops the persisted dataset (one catch-up run per existing device)
  - Pending device checks: iOS auto-play after timeout revert, 8s on park network, prod offline cold open after a HI switch
  - Spec: `docs/specs/gh-77-language-switch-after-precache.md`

## Open
- #63 PWA polish: native feel + UI stress testing
- #65 Offline first-visit fallback screen
- #67 Offline-safe retry queue for `/api/scan` POSTs — real correctness gap (fire-and-forget `postScan`), not part of #64's scope
- #78 Precache: refresh exhibit dataset on online cold open
- #79 Onboarding language picker offers languages with no published audio
- #80 "Refresh content" control: refetch exhibit dataset on demand — reuses #78's refetch (build #78 first)

## Deferred (parallel, not blocking)
- m4-gamification #62 (badge artwork) — milestone otherwise done (4/5)

---

# Other Milestones (summary)

| # | Title | GH# | State |
|---|-------|-----|-------|
| m2c-field-data-collection | GPS tagging + audio for all 66 exhibits | 7 | open |
| m2b-ortho | Swap stub ortho with real drone raster | 8 | open |
| m4-gamification | Trail progress, milestones, discovery cards | 10 | open (1 open: #62 badge art) |
| m5-pwa-offline | Full offline after initial load | 11 | open (6 open) — CURRENT |
| m6-ads | All ad placements live | 12 | open |
| m7-launch-ready | Production-ready, E2E smoke tested | 13 | open |
| m3-amenities | Amenities layer (washrooms, ticketing, restaurant) | 17 | open |
| m8-user-auth | Phone + OTP login, visitor identity | 18 | open — #35 Add phone number with OTP login |
