# Current Milestone: m5-pwa-offline — PWA + Offline

**GitHub:** [#11](https://github.com/makaravind/experium-ai-tour-app/milestone/11)
**Progress:** IN PROGRESS — 5/11 closed

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
- #81 Offline pages: every route and any `/s/<code>` open offline — merged to main 2026-10-17 as `df3b87c` (code review skipped; manual DevTools test on a local prod build passed)
  - Found 2026-10-17 on a prod build: offline only worked on the exact page loaded online (no cached document for `/`, `/map`, `/scan`, `/collection`; `/s/*` cache keyed by exact URL, one entry)
  - Fix: `pages-cache` filled at SW install, navigations network-first (3s) with it as fallback, one prerendered `/s/_shell` for every code (exhibit page reads its code from the URL)
  - Also fixed: `@serwist/next`'s injected register script reloaded the page on every `online` event (`reloadOnOnline: false` in `next.config.ts`)
  - Side effect: `generateStaticParams` makes every other `/s/<code>` ISR-cached on Vercel on first hit (junk codes too)
  - Pending device checks: iOS Safari offline (e2e is Chromium-only), SW install time on Vercel, no reload when signal returns
  - Spec: `docs/specs/gh-81-offline-pages.md`
- #67 Offline-safe retry queue for `/api/scan` POSTs — implemented on `impl/gh-67` (steps 1-10 done), NOT yet merged/pushed to main
  - Local-first discovery: onsite scan counts on device at page land; toast/milestone work offline (`+1 · saved offline`)
  - All scan POSTs via persisted `scanQueue` (`lib/scan-queue.ts`), ordered replay; device `scanned_at` sent, SQL caps at `now()`; server total wins when queue drains
  - Pending: apply `upsert_scan` migration to Supabase BEFORE pushing app main; local prod-build test before push
  - Spec: `docs/specs/gh-67-offline-scan-queue.md`

## Open
- #63 PWA polish: native feel + UI stress testing
- #65 Offline first-visit fallback screen
- #78 Precache: refresh exhibit dataset on online cold open
- #79 Onboarding language picker offers languages with no published audio
- #80 "Refresh content" control: refetch exhibit dataset on demand — reuses #78's refetch (build #78 first)
- #82 Offline map: precache `park.pmtiles`, versioned tile cache, pins from cached data — unblocked; open question: real ortho size
  - Offline map has no exhibit pins: `ParkMap` queries Supabase on every map load instead of `cachedExhibits`

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
