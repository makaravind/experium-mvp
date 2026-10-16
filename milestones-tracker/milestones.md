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
| m4-gamification | Gamification | [#10](https://github.com/makaravind/experium-ai-tour-app/milestone/10) | IN PROGRESS (4/5) | m2a + m2b |
| m5-pwa-offline | PWA + Offline | [#11](https://github.com/makaravind/experium-ai-tour-app/milestone/11) | IN PROGRESS (2/5) | m2a + m2b |
| m6-ads | Ads | [#12](https://github.com/makaravind/experium-ai-tour-app/milestone/12) | NOT STARTED (0/1) | m2a |
| m7-launch-ready | Launch Ready | [#13](https://github.com/makaravind/experium-ai-tour-app/milestone/13) | NOT STARTED (0/5) | m3 + m4 + m5 + m2c + m6 |

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

**Status:** IN PROGRESS — 2/5 closed

### Closed
- Investigate Mapbox offline options for GL JS web — #66 (resolved by m2b-map-migration, no separate build needed)
- Upfront precache (audio + metadata + images) triggered on Home's first open — #64

### Open
- PWA polish: native feel + UI stress testing — #63
- Offline first-visit fallback screen — #65
- Offline-safe retry queue for `/api/scan` POSTs — #67

> `serwist` (next-pwa's successor) is already configured in `app/sw.ts` with reactive `CacheFirst` caching for audio/fonts, plus `public/manifest.json` — but that's passive/on-demand, not the upfront bulk download the original `docs/user-journey.md` flow calls for. #64 closes that gap.
> Cache trigger point: ticket counter hands out a generic app link (Home `/`), not an exhibit QR — visitor has wifi there, loses it walking into the park. So the upfront download fires on Home's first open, not inside the first-exhibit-scan onboarding step.
> #66 resolved without a separate build task — m2b-map-migration's self-hosted `park.pmtiles` is a static asset, precacheable like any other, so the Mapbox-hosted-tiles gap that prompted the investigation no longer exists.
> #67 covers a real correctness gap found while scoping: `postScan` in `ExhibitPageClient.tsx` is fire-and-forget — an offline onsite-discovery POST silently drops today, which can silently break trail-milestone crossing. Confirmed still open — out of #64's scope.
> #64 shipped as an app-wide `AppGate` (gates every route, not just Home) + `lib/precache.ts` + `lib/handshake-lock.ts` (cross-tab visitor-id lock) + a DebugPanel "No precache" toggle for online-only testing. Audio is precached; the app has no per-exhibit images yet so that part of the acceptance criteria doesn't apply, and metadata already works offline via the persisted Zustand store (no network call needed). Spec: `docs/specs/gh-64-upfront-precache.md`. Merged to `main` as `0a73816`.

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

> #68 found while scoping gh-64 (m5-pwa-offline) — solo-dev, no monitoring infra yet, so precache gap-fills/retry-cap-exhaustion/continue-anyway usage would otherwise run unnoticed.

### Out of scope
- Custom admin UI (use Supabase dashboard)
- Multi-park expansion
- OTP auth
