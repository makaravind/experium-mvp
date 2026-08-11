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
                         ▼                              │
                    ┌──────────┐                        │
                    │ m2b-map  │                        │
                    └────┬─────┘                        │
                         │                              │
                    ┌────┴──────────────────┐           │
                    ▼           ▼           │           │
               ┌──────────┐ ┌────────────┐ │           │ ← parallel
               │ m4-gamif │ │ m5-pwa     │ │           │
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
| m1b-dev-mode | Dev Mode | [#5](https://github.com/makaravind/experium-ai-tour-app/milestone/5) | NOT STARTED | m1 |
| m2a-exhibit-audio | Exhibit Audio | [#6](https://github.com/makaravind/experium-ai-tour-app/milestone/6) | NOT STARTED | m1 |
| m2c-data-collection | Data Collection | [#7](https://github.com/makaravind/experium-ai-tour-app/milestone/7) | NOT STARTED | m1 + **drone footage** |
| m2b-map | Map | [#8](https://github.com/makaravind/experium-ai-tour-app/milestone/8) | NOT STARTED | m2c |
| m3-home-tab | Home Tab | [#9](https://github.com/makaravind/experium-ai-tour-app/milestone/9) | NOT STARTED | m2a |
| m4-gamification | Gamification | [#10](https://github.com/makaravind/experium-ai-tour-app/milestone/10) | NOT STARTED | m2a + m2b |
| m5-pwa-offline | PWA + Offline | [#11](https://github.com/makaravind/experium-ai-tour-app/milestone/11) | NOT STARTED | m2a + m2b |
| m6-ads | Ads | [#12](https://github.com/makaravind/experium-ai-tour-app/milestone/12) | NOT STARTED | m2a |
| m7-launch-ready | Launch Ready | [#13](https://github.com/makaravind/experium-ai-tour-app/milestone/13) | NOT STARTED | m3 + m4 + m5 + m2c + m6 |

> Note: GitHub milestones #1–3 (App Pilot, V1, V1-QR plates) are stale from the old tracker — close manually if needed.

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

## m2b-map

**Goal:** Mapbox map renders with real exhibit pins (from m2c), GPS dot, and pin tap → Preview bottom sheet.

⚠ **Blocked on:** m2c (needs GPS-tagged exhibit coordinates before pins can be placed)

### Scope
- Mapbox GL JS map with drone ortho raster tileset
- Exhibit pins as GeoJSON (all 50, orange/green state, category sizing A/B/C)
- GPS dot via `watchPosition()`, blue accuracy circle
- Nearby pulse animation (50m radius, max 5 pins)
- Pin tap → Preview bottom sheet (State B)
- Map zoom animation on QR scan
- Pinch/pan/zoom, last-viewed position restore

### Out of scope
- Trail routing (A→B BFS) — deferred, see open-questions.md #25
- Trail GeoJSON tracing (m7)

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

### Scope
- Trail progress bar (Home + post-audio context): segment scoping, green filled / hollow upcoming nodes
- Milestone detection in Zustand (thresholds: 1, 3, 5, 10, 15, 20, 30, 40, 50)
- Tappable completed milestone nodes → revisit celebration overlay
- Discovery Card (milestones 10 + 50): HTML Canvas → PNG, `navigator.share` / download
- User name injection on card (nullable, tap-to-edit)

### Out of scope
- Physical rewards (park discount etc.) — needs park agreement
- Per-type badges (v2)

---

## m5-pwa-offline

**Goal:** App is fully functional after initial load with no network.

### Scope
- `next-pwa` configured with upfront cache strategy
- Service worker caches all 50 audio files + exhibit metadata + map assets (~25MB)
- Offline first-visit fallback screen ("Connect to internet to start")
- Offline return-visit: fully functional from cache

### Out of scope
- Background sync, push notifications

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

### Out of scope
- Custom admin UI (use Supabase dashboard)
- Multi-park expansion
- OTP auth
