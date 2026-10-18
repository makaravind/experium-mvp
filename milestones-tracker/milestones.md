# Milestones Tracker

## Dependency Diagram

```
START
  │
  ▼
┌──────────────────────────┐
│ m1-foundation            │
└──────┬───────────────────┘
       │
  ┌────┴────────────────────────┐
  ▼                             ▼
┌──────────────┐    ┌───────────────────────────┐
│ m1b-dev-mode │    │ m2a-exhibit-audio         │ ← parallel
│ (dev utility)│    └──────────┬────────────────┘
└──────────────┘               │
                          ┌────┴──────────────────────────┐
                          ▼                               ▼
                    ┌──────────┐                 ┌──────────────┐
                    │ m2c-data │                 │ m3-home-tab  │ ← parallel
                    │ -collect │                 └──────┬───────┘
                    │ ⚠ drone  │                        │
                    └────┬─────┘                        │
                         │                              │
              ┌──────────┴──────────────┐               │
              ▼                         ▼               │
         ┌──────────┐         ┌─────────────────┐       │
         │m2b-ortho │         │ m2b-mechanics   │       │
         │(tileset) │         │(pins,GPS,search)│       │
         └────┬─────┘         └────┬────────────┘       │
              └──────────┬─────────┘                     │
                         │                              │
                    ┌────┴──────────────────┐           │
                    ▼                       │           │
             ┌─────────────────┐            │           │
             │m2b-map-migration│            │           │
             │(MapLibre+PMTiles│            │           │
             └────────┬────────┘            │           │
                      │                    │           │
                    ┌─┴─────────────────┐  │           │
                    ▼           ▼       │  │           │
               ┌──────────┐ ┌────────┐  │  │ ← parallel
               │ m4-gamif │ │ m5-pwa │  │  │
               └────┬─────┘ └──────┬─────┘ │           │
                    └───────┬───────┘       │           │
                            └──────┬────────┘           │
                            m6-ads │                    │
                                   └──────┬─────────────┘
                                          ▼
                               ┌──────────────────┐
                               │ m7-launch-ready  │
                               └──────────────────┘
```

---

## Milestones Table

| ID | Milestone | GitHub | Status | Blocked By |
|----|-----------|--------|--------|------------|
| m1-foundation | Foundation | [#4](https://github.com/makaravind/experium-ai-tour-app/milestone/4) | DONE | — |
| m1b-dev-mode | Dev Mode | [#5](https://github.com/makaravind/experium-ai-tour-app/milestone/5) | DONE | m1 |
| m2a-exhibit-audio | Exhibit Audio | [#6](https://github.com/makaravind/experium-ai-tour-app/milestone/6) | DONE | m1 |
| m2c-data-collection | Data Collection | [#7](https://github.com/makaravind/experium-ai-tour-app/milestone/7) | IN PROGRESS (3/8) | m1 + **drone footage** |
| m2b-ortho | Map Ortho Tileset | [#8](https://github.com/makaravind/experium-ai-tour-app/milestone/8) | SUPERSEDED | superseded by m2b-map-migration |
| m2b-mechanics | Map Mechanics | [#15](https://github.com/makaravind/experium-ai-tour-app/milestone/15) | DONE | m2c |
| m2b-map-migration | Map Migration (Mapbox → MapLibre + PMTiles) | [#16](https://github.com/makaravind/experium-ai-tour-app/milestone/16) | DONE | m2b-mechanics |
| m3-home-tab | Home Tab | [#9](https://github.com/makaravind/experium-ai-tour-app/milestone/9) | DONE | m2a |
| m3-amenities | Amenities (washroom, ticketing, food, gate) | [#17](https://github.com/makaravind/experium-ai-tour-app/milestone/17) | DONE (7/7) — merged to main `7dcbcb9` 2026-10-18; `docs/specs/m3-amenities.md` | m2b-map-migration + m5 precache |
| m4-gamification | Gamification | [#10](https://github.com/makaravind/experium-ai-tour-app/milestone/10) | IN PROGRESS (4/5) | m2a + m2b |
| m5-pwa-offline | PWA + Offline | [#11](https://github.com/makaravind/experium-ai-tour-app/milestone/11) | IN PROGRESS (9/11) | m2a + m2b |
| m6-ads | Ads | [#12](https://github.com/makaravind/experium-ai-tour-app/milestone/12) | NOT STARTED (0/1) | m2a |
| m7-launch-ready | Launch Ready | [#13](https://github.com/makaravind/experium-ai-tour-app/milestone/13) | NOT STARTED (0/5) | m3 + m4 + m5 + m2c + m6 |
| m8-user-auth | Phone + OTP login | [#18](https://github.com/makaravind/experium-ai-tour-app/milestone/18) | DEFERRED (0/1) — designed, not built; blocked on India SMS / DLT. Design: `docs/phone-otp-auth.md` | m7 |

> Note: GitHub milestones #1–3 (App Pilot, V1, V1-QR plates) and #14 (m2c-placeholder-data) are closed/stale — ignore.
> `m2b-map` was split into `m2b-ortho` (#8) and `m2b-mechanics` (#15).

---

## m1-foundation

**Goal:** DB schema live, `/s/[code]` resolves exhibit data, Vercel deploy pipeline working.

### Scope
- Supabase: all 8 tables (exhibits, qr_codes, sponsors, scans, users, user_progress, reports, ads), RLS policies, storage buckets for audio + images
- Next.js App Router scaffold in `experium-ai-tour-app/`
- `/s/[code]` SSR route — resolves code → exhibit data from DB
- Zustand store skeleton (language, visitedExhibits, audioState)
- Vercel deploy pipeline wired to `makaravind` GitHub account

### Out of scope
- Any UI beyond route resolution
- Map, audio, auth

---

## m1b-dev-mode

**Goal:** Debug overlay available during E2E manual testing — env-gated, invisible in production.

### Scope
- Debug overlay triggered by `?debug=1` URL param or env flag
- Shows: current exhibit code, resolved exhibit ID, API response status
- Shows: Zustand state (language, visitedExhibits, audioState)
- Shows: GPS coordinates + accuracy radius
- Shows: audio load state, play events, scan log payload
- Hidden in production (env-gated)

### Out of scope
- Formal test suite (unit/integration)
- Admin dashboard

---

## m2a-exhibit-audio

**Goal:** Visitor can scan a QR (or open `/s/[code]` link), go through onboarding, and hear audio for an exhibit — no map required.

### Scope
- Onboarding: loading screen, asset download progress, language picker, optional info modal (name/phone/email)
- In-app QR camera scan + `/s/[code]` deep link entry
- Bottom sheet (Active state — scanned QR path)
- Full-screen audio player: circular progress ring, language toggle, scrubber
- Post-audio: `+1` toast, `POST /api/scan` log, milestone celebration overlay (S5)
- `POST /api/user/info` endpoint
- Map stub (placeholder, no real Mapbox integration)

### Out of scope
- Mapbox map, GPS, pin states, Preview sheet (pin tap)
- Drone ortho tileset
- Ads, gamification persistence, home tab

---

## m2c-data-collection

**Goal:** All 50 exhibits GPS-tagged, metadata recorded, audio generated and uploaded, DB seeded.

⚠ **Blocked on:** drone ortho footage from vendor (dronee.in / Sai Vakki)

### Scope
- Walk the park with the ortho map open — GPS-tag all 50 exhibit locations
- Record exhibit metadata: name, type (plant/structure/water/landmark), category (A/B/C), scientific name
- Interview domain experts (botanist, historian) for content scripts
- Generate audio via TTS (ElevenLabs / Google TTS) — EN, HI, TE per exhibit
- Upload audio files + exhibit photos to Supabase Storage
- Seed `exhibits` table + assign QR codes (code → exhibit_id)

### Out of scope
- Trail GeoJSON tracing (m7)
- Sponsor / ad content
- Physical QR plate printing

---

## m2b-ortho

**Goal:** Drone ortho raster tileset uploaded to Mapbox and rendering correctly on the map.

⚠ **Blocked on:** m2c (needs drone footage from vendor)

### Scope
- Upload processed GeoTIFF ortho to Mapbox as raster tileset
- Map renders ortho layer as base (replacing satellite)
- Trail discovery paths GeoJSON (1 open issue)

### Open issues
- Trail discovery paths (#TBD)

### Out of scope
- Exhibit pins, GPS, preview sheet

---

## m2b-mechanics

**Goal:** Map interactions fully working — exhibit pins, GPS dot, nearby pulse, zoom-on-scan, search.

**Status:** DONE — 9/9 closed

### Closed
- Build Map view (Mapbox base) — #8
- Real Mapbox map on Map tab — #47
- Exhibit pins + Preview bottom sheet — #48
- Off-screen peek chips — #57
- Zoom-on-scan + last-viewed position restore — #51
- GPS dot — #49
- 3D metal map markers (Three.js custom layer) — #58
- Nearby pulse animation — #50
- Search feature — #56

### Scope
- Exhibit pins as GeoJSON (orange/green state)
- GPS dot via `watchPosition()`, blue accuracy circle
- Nearby pulse animation (50m radius, max 5 pins)
- Pin tap → Preview bottom sheet (unified PreviewSheet)
- Map zoom animation on QR scan (`/s/[code]?scan=1`)
- Search bar (static placeholder → live filtering)
- Pinch/pan/zoom, last-viewed position restore

### Out of scope
- Ortho tileset upload (m2b-ortho)
- Trail routing (A→B BFS) — deferred

---

## m3-home-tab

**Goal:** Home tab UI is complete — progress display, scan CTA, navigation links.

### Scope
- Home tab: fresh vs returning user states
- Trail progress bar display (from Zustand/localStorage)
- Scan Now CTA → opens camera immediately
- Explore the Park link → Map tab
- Tab bar: Home · Scan · Map

### Out of scope
- Ad placements on home screen (m6-ads)

---

## m3-amenities

**Goal:** Amenities layer (washroom, ticketing, food, gate): map chips, peek/expanded sheet, search mode, offline via the persisted dataset. Also makes exhibit pins/search offline (GPS cached; absorbs the pins half of #82).

**Spec:** `docs/specs/m3-amenities.md` — one spec, one production push.

**Status:** DONE — merged to main as `7dcbcb9` (2026-10-18); GitHub milestone #17 closed, #70 closed as duplicate of #71, #72 closed as superseded (no API route). `amenities` migration + mock seed row applied to production Supabase 2026-10-18.

```
T0 BottomSheet/SheetSummary extraction ─┐
                                         ├─► T2 chips + AmenitySheet (#73 #74) ─┐
T1 migration + store v2 + precache ─────┤                                       ├─► ship
   + map/search from store (#71 #72 #76)└─► T3 pill + search mode (#75) ────────┘
```

### Scope
- `amenities` table (TEXT+CHECK type, RLS public read) + one mock seed row near Baobab Forest
- No API route: direct Supabase fetch in `runPrecache`; `cachedAmenities` persisted, store v2 clears `cachedExhibits`
- `CachedExhibit` gains GPS + status; `ParkMap`/search read the store (offline pins)
- Shared `BottomSheet` extracted from `PreviewSheet`; `AmenitySheet` on top
- DOM chips, `activeAmenityId`, Amenities pill + search amenity mode

### Shipped notes
- Pins half of #82 shipped here: exhibit GPS + status live in `cachedExhibits`, map and search read the store (offline pins). #82 keeps only the pmtiles/ortho part
- Search overlay and Amenities pill got micro-animations (fade/rise, staggered rows, press feedback; local `MotionConfig reducedMotion="user"`)
- Pending: mock "Main Washroom" row stays until the m2c real-data migration deletes it by id; device checks (iOS Safari offline, real-GPS distance badge) not done

### Out of scope
- Real amenity photos / image cache (placeholders only)
- Report flag on the sheet (m7; `reports` needs an amenity reference)
- Off-screen amenity chips, clustering
- Real GPS rows (m2c field data, separate migration; deletes the mock row)

---

## m4-gamification

**Goal:** Visitors are motivated to keep scanning — trail progress, milestone celebrations, and downloadable discovery cards.

**Status:** IN PROGRESS — 4/5 closed

### Closed
- Post-audio toast + auto milestone celebration (S4→S5) — #59
- Card reveal & collection (expanded from Discovery Card 10&50) — #61

### Open
- Milestone badge artwork — #62 (parallel, no blocker)

> #20 closed — superseded by #59 (reworked to match full S4/S5 spec: toast + full-screen gradient/confetti overlay, instead of the plain `MilestoneModal`).
> #60 closed — superseded by #59. Building the real `MilestoneCelebration` overlay in #59 made the later `TrailCard`-to-overlay swap (#60's whole scope) redundant work, so #59's spec does it directly. Spec: `docs/specs/gh-59-post-audio-celebration.md`.
> Trail bar already exists on Home (`TrailCard.tsx` + `lib/trail.ts`) — a duplicate post-audio trail bar was considered and dropped as redundant with the post-audio toast's "X/50" count.
> #61 scope expanded during spec grilling from "Discovery Card at milestones 10/50 only" to all 9 milestones + a persistent, browsable `/collection` route (fanned-stack binder, tap-to-flip reveal) replacing the one-off celebration CTA; `MilestoneCelebration.tsx` retired. Spec: `docs/specs/gh-61-card-reveal-collection.md`. Merged to `main` as `3c6a0f5`.

### Scope
- Milestone detection in Zustand (thresholds: 1, 3, 5, 10, 15, 20, 30, 40, 50)
- Tappable completed milestone nodes → revisit celebration overlay
- Discovery Card (milestones 10 + 50): HTML Canvas → PNG, download
- User name injection on card (nullable, tap-to-edit)
- Badge artwork for the 9 thresholds (code ships with placeholder until #62 lands)

### Out of scope
- Trail progress bar in post-audio context — dropped as redundant with Home + the post-audio toast
- Physical rewards (park discount etc.) — needs park agreement
- Per-type badges (v2)
- `navigator.share` — download only for v1; manual share via device share sheet

---

## m2b-map-migration

**Goal:** Replace Mapbox GL JS with MapLibre GL JS + self-hosted PMTiles orthophoto. Map works fully offline — tiles are a static asset precacheable by the service worker. Removes Mapbox token dependency.

**Blocks:** m5-pwa-offline (#66 is resolved by this migration — no separate investigation needed)
**Supersedes:** m2b-ortho (#8) — "upload to Mapbox tileset" is replaced by PMTiles pipeline

### Scope
- Replace `mapbox-gl` → `maplibre-gl` in package.json + update all imports in `ParkMapbox.tsx`, `marker-layer.ts`
- Process `drony.in.tif` → `park.pmtiles` using pipeline from `sample-map/pmtiles-poc/` (gdalwarp → gdal2tiles → pmtiles convert)
- Upload `park.pmtiles` to Supabase Storage (public bucket, range-request capable)
- Wire PMTiles protocol in `ParkMapbox.tsx`: register `pmtiles://` protocol, swap raster source URL
- Verify Three.js custom marker layer works unchanged under MapLibre (API-compatible)
- Remove `NEXT_PUBLIC_MAPBOX_TOKEN` from env — no longer needed
- Close #66 (Mapbox offline investigation) as resolved

### Out of scope
- Re-doing any m2b-mechanics features (pins, GPS, peek chips) — all stay as-is
- Changing the tile zoom range or reprocessing at higher resolution (z14–z19 from POC is sufficient)

---

## m5-pwa-offline

**Goal:** App is fully functional after initial load with no network.

**Status:** IN PROGRESS — 9/11 closed

### Closed
- Investigate Mapbox offline options for GL JS web — #66 (resolved by m2b-map-migration, no separate build needed)
- Upfront precache (audio + metadata + images) triggered on Home's first open — #64
- Language switch after precache: blocking re-download + exhibit sheet shows one language — #77
- Offline pages: every route and any `/s/<code>` open offline after precache — #81
- Offline-safe retry queue for `/api/scan` POSTs — #67
- Offline first-visit fallback screen — #65
- Precache: refresh exhibit dataset on online cold open — #78
- "Refresh content" control: refetch exhibit dataset on demand — #80
- Onboarding language picker offers languages with no published audio — #79 (closed not planned, no spec)

> #67 fixed a real correctness gap: `postScan` was fire-and-forget, so an offline onsite-discovery POST was lost. Now every scan POST goes through a persisted `scanQueue` (`lib/scan-queue.ts`) that replays in order; onsite discovery counts locally at page land (toast/milestone work offline), device `scanned_at` sent (SQL caps at `now()`), server total replaces local count when queue drains. Spec: `docs/specs/gh-67-offline-scan-queue.md`. Merged to main as `ec2b7a7`. The `upsert_scan` DB migration (`supabase/migrations/20261017120000_upsert_scan_scanned_at.sql`) was applied to production Supabase on 2026-10-18.

### Open
- PWA install + production hardening — #83
- Offline map: precache `park.pmtiles`, versioned tile cache, pins from cached data — #82

> `serwist` (next-pwa's successor) is already configured in `app/sw.ts` with reactive `CacheFirst` caching for audio/fonts, plus `public/manifest.json` — but that's passive/on-demand, not the upfront bulk download the original `docs/user-journey.md` flow calls for. #64 closes that gap.
> Cache trigger point: ticket counter hands out a generic app link (Home `/`), not an exhibit QR — visitor has wifi there, loses it walking into the park. So the upfront download fires on Home's first open, not inside the first-exhibit-scan onboarding step.
> #66 resolved without a separate build task — m2b-map-migration's self-hosted `park.pmtiles` is a static asset, precacheable like any other, so the Mapbox-hosted-tiles gap that prompted the investigation no longer exists.
> #67 fixed a real correctness gap found while scoping #64: `postScan` in `ExhibitPageClient.tsx` was fire-and-forget, so an offline onsite-discovery POST was lost for good and could silently break trail-milestone crossing. Now every scan POST goes through a persisted queue (`lib/scan-queue.ts`) that replays in order; onsite discovery counts locally at page land (toast/milestone work offline), the device `scanned_at` is sent (SQL caps at `now()`), and the server total replaces the local count when the queue drains. Spec: `docs/specs/gh-67-offline-scan-queue.md`. Merged to main as `ec2b7a7`. The `upsert_scan` DB migration was applied to production Supabase on 2026-10-18.
> #64 shipped as an app-wide `AppGate` (gates every route, not just Home) + `lib/precache.ts` + `lib/handshake-lock.ts` (cross-tab visitor-id lock) + a DebugPanel "No precache" toggle for online-only testing. Audio is precached; the app has no per-exhibit images yet so that part of the acceptance criteria doesn't apply, and metadata already works offline via the persisted Zustand store (no network call needed). Spec: `docs/specs/gh-64-upfront-precache.md`. Merged to `main` as `0a73816`.
> #77 fixed two #64 regressions: a sheet language chip re-ran the blocking precache (unmounting the whole app), and the exhibit sheet showed only the selected language. The precache now covers only the onboarding language (`precacheLanguage`); other languages stream online, and a failed or missing one reverts to `precacheLanguage` with a toast. #78–#80 were split out while scoping it. Spec: `docs/specs/gh-77-language-switch-after-precache.md`. Merged to `main` as `48d6881`.
> #81 and #82 found 2026-10-17 while verifying the map gap on a production build: after a precache that starts on Home (the ticket-counter path), offline only worked on the exact page loaded online. No document was cached for `/`, `/map`, `/scan`, `/collection`, and the `/s/*` cache held one exact URL, so the first phone-camera QR scan in the park hit a browser error page. `park.pmtiles` is only cached on the first online map view, so the Map tab fell back to `MapStub`. #81 caches every page document at SW install (network-first navigations, one prerendered `/s/_shell` for every code) and also stops `@serwist/next`'s injected script from reloading the page on every `online` event. Spec: `docs/specs/gh-81-offline-pages.md`. Merged to `main` as `df3b87c`. Testing it showed the offline map has no exhibit pins either (`ParkMap` queries Supabase on load), added to #82.
> #78, #80 and #65 shipped as one PR: a "More" (⋯) tab opens a `UserMenu` sheet whose "Refresh content" row clears `cachedExhibits` and reruns `AppGate` (disabled when offline); "Log out" / "Profile" are disabled "Soon" placeholders. #65's two defects are fixed: offline with a saved dataset enters the app instead of the blocker, and an error while online shows a `fetch-error` screen instead of "Connect to the internet". Merged to `main` as `79642c2` (pushed). Spec: `docs/specs/gh-78-dataset-refresh.md`.
> #79 closed as not planned: content is static and EN/HI/TE are all complete before launch, so the picker never offers a language with zero audio and a dynamic picker is unneeded. Revisit if a language ships partial: the `PreviewSheet` fallback revert is sticky (`setLanguage` persists), and a TE-onboarded visitor on an exhibit without TE has no revert target (`precacheLanguage == language`), so they get a toast and silence even though EN/HI exist (~3-line fix in `PreviewSheet.tsx` `fallback()`).
> #63 moved to m7-launch-ready (2026-10-18): it needs the `/mobile-native` and `/break-ui` skills and isn't part of the offline goal.
> #83 filed 2026-10-18 from a PWA checklist audit: 17 gaps (11 launch blockers: icons / install prompt, safe-area, SW update toast, security headers). Acceptance: Lighthouse PWA score ≥ 90.

### Scope
- Upfront precache: audio (selected language) + exhibit metadata + images (single variant) + offline-safe scan retry
- Offline first-visit fallback screen ("Connect to internet to start")
- Offline return-visit: fully functional from cache
- Map offline: investigation only this round — Mapbox web has no sanctioned path for bulk tile caching

### Out of scope
- Background sync, push notifications
- Tiered image resolutions (thumbnail/medium/full) — single variant for v1

---

## m6-ads

**Goal:** All ad placements are live and impression/click events are logged.

### Scope
- Ad config system (`ads` table, tier_target, placement enum)
- Map overlay ad (dismissible, 2-3s auto-collapse, impression log)
- Banner ad during audio (S3)
- Post-audio ad slot
- Home screen banner ad
- `ad_clicked` logging on scan record

### Out of scope
- Ad reporting dashboard
- Third-party ad network integration

---

## m7-launch-ready

**Goal:** App is production-ready — issue reporting, analytics, trail map, and E2E smoke-tested.

### Scope
- Report issue: modal (dropdown + free-text), `POST /api/report`, toast confirmation
- Scan analytics views in Supabase (listen rate, ad CTR, scans/marker/day)
- Trail segments traced as GeoJSON (after ortho uploaded)
- E2E smoke test on device (all flows, all languages)
- Precache/offline failure observability, replacing the console.log stopgap — #68
- PWA polish: native feel + UI stress testing — #63 (moved from m5-pwa-offline 2026-10-18)

> #68 found while scoping gh-64 (m5-pwa-offline) — solo-dev, no monitoring infra yet, so precache gap-fills/retry-cap-exhaustion/continue-anyway usage would otherwise run unnoticed.

### Out of scope
- Custom admin UI (use Supabase dashboard)
- Multi-park expansion
- OTP auth

---

## m8-user-auth

**Goal:** Phone + OTP login: restore progress after clearing storage or switching phone, and capture verified leads.

**Status:** DEFERRED (0/1) — designed 2026-10-18, implementation skipped for now. Blocked on India SMS delivery (DLT registration / provider choice). **Design, decisions, India SMS research and the revisit checklist: `docs/phone-otp-auth.md`.**

### Open
- Add phone number with OTP login — #35 (issue body is empty; fill it from the doc before starting)

### Decided (summary)
- Behind a build-time flag `NEXT_PUBLIC_PHONE_AUTH_ENABLED`; off = app unchanged (`docs/decisions.md` still says "No OTP in v1")
- Supabase Auth phone OTP, claimed once via `POST /api/auth/claim`, session then dropped; identity stays `users.id`
- Number already on another row → that account replaces this device's progress
- Onboarding step (skippable) + More-menu row; "Log out" = forget this device
- Phone stored plain with a separate marketing opt-in checkbox

### Before building
- Pick the DLT path (Twilio International first, India provider later) and test-send to a +91 number
- Raise the Supabase SMS rate limit (default 30/hour per project) and re-decide abuse protection
- Privacy policy page (open question #9)
