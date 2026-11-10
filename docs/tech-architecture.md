# Technical Architecture

## System Overview

```
[QR Code Marker]
      ↓ (scan)
[Phone Browser → GET /s/{code}]
      ↓
[Server: resolve code → exhibit, log scan]
      ↓
[Serve webapp page with exhibit data + ads]
      ↓
[Client: fetch audio from CDN, play on tap]
```

## URL Scheme

```
Production:  https://{domain}/s/{code}
Example:     https://experium.aikyatechnology.in/s/A7X3

/s/{code}  → visitor experience (resolve + render)
/admin     → admin tool (dev-only: served under `next dev`, 404 in production)
/api/*     → backend API (`/api/admin/*` is dev-only, 404 in production)
```

The `/s/{code}` endpoint:
1. Looks up `code` in DB → gets `exhibit_id`, `ad_tier`, `status`
2. Logs the scan (timestamp, device, user if known)
3. If active: renders exhibit page
4. If inactive: renders "content coming soon" fallback

## Tech Stack (v1)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Hosting | Vercel | Next.js first-class support, free tier handles traffic |
| Frontend | Next.js (App Router) | SSR for fast first paint, React for interactivity |
| Backend | Next.js API routes (serverless) | Minimal infra, co-located with frontend |
| Database | Supabase (Postgres + Auth + Storage) | One platform: DB, auth, file storage, dashboard as admin UI |
| DB Client | Supabase JS (`@supabase/supabase-js`) | Single SDK for queries, auth, storage — no ORM needed |
| Audio/Files | Supabase Storage (built-in CDN via Fastly) | Fewer components — no separate AWS account/S3/CloudFront |
| State Mgmt | Zustand | Single store (~50 lines), handles audio + progress + language pref |
| Styling | Tailwind CSS + shadcn/ui | Fast iteration, accessible components, zero runtime overhead |
| Map | MapLibre GL v4 + drone orthophoto tileset | Open-source Mapbox GL fork (no API key); ortho raster tiles; exhibit pins as GeoJSON; GPS "you are here" via watchPosition() |
| Map tiles | PMTiles (`pmtiles`) | Single-file tile archive served from Supabase Storage; no tile server needed |
| 3D / visualization | Three.js (`three`) | Used for 3D map elements and exhibit visualizations |
| 360° panorama | `@photo-sphere-viewer/core` + `virtual-tour-plugin` + `markers-plugin` | Node graph navigation with nav arrows + exhibit pin markers; `preload: true` prefetches adjacent nodes; plain equirect in v1, tile pyramid (via `equirectangular-tiles-adapter`) deferred to v2 |
| Panorama images | 4096×2048 JPEG 85% (~2.8MB/image) | Resized locally from 12K masters via `sips`; hosted on Supabase Storage; `tour_nodes.tiles_url` (production) or direct URL (v1) |
| Trail routing | Custom BFS (planned) | Segment graph in `public/data/trails.geojson`; BFS chains segments for A→B routing — `@turf/*` not yet installed |
| Animation | Framer Motion | All UI transitions, sheet open/close, menu animations |
| PWA / Offline | `@serwist/next` (full upfront ~25MB download) | Offline-first after initial load; all audio cached via service worker |
| Auth (admin) | Supabase Auth (magic link) | Already in stack, RLS integration, no password management |
| Auth (visitor) | FingerprintJS + optional info capture | `@fingerprintjs/fingerprintjs` for persistent identity without login; plain inputs stored locally, synced to server when online |
| UI primitives | `@base-ui/react` + shadcn/ui | Base UI for headless accessible primitives; shadcn for pre-styled components |
| Admin UI | Dev-only `/admin` tool (MapLibre + staged edits, one transactional Save) | Sections, exhibits, audio, photos and amenities edited on the map; see [Admin Tool](#admin-tool-dev-only). Supabase dashboard remains for everything else (QR codes, reports, ads) |
| Analytics | Custom (DB writes) + Vercel Analytics | Scan logging in DB; `@vercel/analytics` for page-level traffic |
| TTS | Deferred (ElevenLabs / Google TTS per batch) | Not a runtime dep — manual content pipeline step |
| DNS / Email | Cloudflare (Email Routing, free tier) | DNS for `aikyatechnology.in`; subdomain `experium.aikyatechnology.in` for app; forwards `experium@aikyatechnology.in` → Gmail for visitor feedback |
| Testing (unit) | Vitest + Testing Library | Component and hook tests |
| Testing (E2E) | Playwright (Chromium + WebKit) | Full flow tests on every PR to main; Supabase mocked via `page.route` |

**External services: 3** — Vercel (hosting) + Supabase (DB/storage/auth) + Cloudflare (DNS + email routing).

## Database Schema (High-Level)

### Core Tables

```sql
exhibits
  id            UUID PK
  name          TEXT          -- "Neem Tree", "Ancient Stone Arch", "Lotus Lake"
  type          ENUM (plant, structure, water_body, landmark)
  category      ENUM (A, B, C) DEFAULT B  -- priority tier: A=premium, B=standard, C=minimal
  scientific_name TEXT NULL   -- optional, primarily for plants
  description   TEXT          -- Brief text description
  photo_url     TEXT          -- Exhibit photo on CDN
  audio_en      TEXT          -- Audio URL (English)
  audio_hi      TEXT          -- Audio URL (Hindi)
  audio_te      TEXT          -- Audio URL (Telugu)
  created_at    TIMESTAMP

qr_codes
  id            UUID PK
  code          TEXT UNIQUE   -- "A7X3" (short, permanent)
  exhibit_id    FK → exhibits -- nullable (can be unassigned)
  sponsor_id    FK → sponsors
  ad_tier       ENUM (gold, silver, bronze)
  gps_lat       FLOAT
  gps_lng       FLOAT
  status        ENUM (active, needs_attention, inactive)
  install_date  DATE
  last_checked  DATE
  notes         TEXT

sponsors
  id            UUID PK
  name          TEXT
  logo_url      TEXT
  contact_info  TEXT

scans
  id            UUID PK
  qr_code_id   FK → qr_codes
  user_id       FK → users (nullable)
  scanned_at    TIMESTAMP
  device_type   TEXT
  listened      BOOLEAN       -- did they press play?
  listen_duration_sec INT     -- how much they heard
  ad_clicked    BOOLEAN

users
  id            UUID PK
  name          TEXT NULL     -- optional, captured on first-load modal
  phone         TEXT NULL     -- optional, captured on first-load modal (no OTP in v1)
  email         TEXT NULL     -- optional, captured on first-load modal
  language_pref TEXT          -- en, hi, te
  created_at    TIMESTAMP

user_progress
  id            UUID PK
  user_id       FK → users
  exhibit_id    FK → exhibits
  discovered_at TIMESTAMP

reports
  id            UUID PK
  qr_code_id   FK → qr_codes
  reporter_type ENUM (user, maintainer)
  issue_type    ENUM (wrong_info, damaged, audio_broken, other)
  description   TEXT
  photo_url     TEXT
  status        ENUM (open, under_review, resolved)
  created_at    TIMESTAMP
  resolved_at   TIMESTAMP

ads
  id            UUID PK
  advertiser    TEXT
  image_url     TEXT
  click_url     TEXT
  placement     ENUM (splash, banner, post_audio)
  tier_target   ENUM (gold, silver, bronze, all)
  active        BOOLEAN
  start_date    DATE
  end_date      DATE
```

### Sections, Display IDs and Amenities

The tables above are high-level; these were added with the admin tool (migrations `20261110000100`–`20261110000400`) and match the live schema.

```sql
sections
  id            TEXT PK       -- letters only, ^[A-Z]+$  ("A", "B", … "P")
  polygon       JSONB         -- [[lng, lat], …], >= 3 points; the park is split into named polygons
  created_at / updated_at

exhibits  (additions)
  code          SMALLINT UNIQUE  -- PERMANENT internal code: /s/{code} URLs and QR scans. Never changes.
  section       TEXT NOT NULL    -- FK → sections.id ON UPDATE CASCADE (renaming a letter is one row update)
  number        SMALLINT NOT NULL CHECK (number > 0)
  UNIQUE (section, number) DEFERRABLE INITIALLY DEFERRED   -- lets one transaction swap/shift numbers

amenities  (additions)
  section       TEXT NOT NULL    -- FK → sections.id ON UPDATE CASCADE; letter only, no number
```

- **Display ID** = `section || number` (e.g. `K1`). It is what visitors see on map pins, the preview sheet and in search; it may change when an exhibit is physically moved. `code` does not.
- **Amenities** show only the section ("Washroom · Section G") on the amenity sheet; two of one type in a section are told apart by name.
- **Placement rule:** the polygon is the source of truth. A pin must lie inside a section (first polygon wins on overlap); dropping outside snaps back. A section that holds exhibits or amenities cannot be deleted, and a reshape that would strand one is rejected.
- **Numbering:** a new or moved exhibit takes the lowest free positive number in its section.
- `sections` has anon `SELECT`; all writes go through the service role.

## API Endpoints

### Public (Visitor)

```
GET  /s/{code}              → Resolve QR, render exhibit page (SSR)
GET  /api/exhibit/{id}      → Exhibit data + audio URLs
POST /api/scan              → Log a scan event (accepts optional `scanned_at`, device scan time; capped at now() in SQL)
POST /api/report            → Submit issue report
POST /api/user/info         → Save optional user details (name/phone/email)
GET  /api/progress          → User's discovered exhibits
GET  /api/exhibits/all      → All exhibit metadata + coords (for offline cache)
```

### Admin (dev-only)

All handlers start with `adminGuard()` (`lib/admin/guard.ts`), which returns 404 when `NODE_ENV === 'production'`.

```
GET  /api/admin/data          → sections, exhibits, audio, photos, amenities (the editor's loaded state)
POST /api/admin/save          → one changeset → RPC admin_apply_changes(jsonb), single transaction
POST /api/admin/upload-audio  → WAV/MP3 → ffmpeg 64kbps mono MP3 → Storage `audio/{code}/{lang}-{ts}.mp3`
POST /api/admin/upload-photo  → image → sharp, max 1600px WebP → Storage `images/exhibits/{code}/{uuid}.webp`
```

Everything not covered by the tool (QR codes, reports, ads, deleting exhibits) is still done in the Supabase dashboard.

## Admin Tool (dev-only)

`/admin` in `experium-ai-tour-app`, usable only from a machine running `next dev` (`npm run dev`). It edits the **live** database; there is no staging project.

- **Map:** MapLibre over `park.pmtiles`. Draw, reshape (vertex drag), rename and delete sections; drag exhibit pins (cross-section move renumbers) and amenity pins; click inside a section to add an exhibit or an amenity (Exhibit | Amenity toggle).
- **Panels:** Details (name, type, tier, status, description, facts JSON, number), Audio (script, status, preview, upload per en/hi/te), Photos (upload, caption, hero, reorder, delete) for exhibits; a single Details panel (name, type, description, delete) for amenities.
- **Staged edits:** all changes live in client state. A bar shows the diff ("2 moved, 1 amenity added…") with Save and Discard. Save posts one changeset to `admin_apply_changes`; any failure rolls everything back and shows the DB error verbatim. Save is blocked while any exhibit or amenity is unplaced, or a panel holds an invalid value.
- **Uploads are immediate but non-destructive:** files go to Storage under a new unique path; the DB only points at them after Save. Discarded uploads leave orphan files (accepted pre-launch).
- **Changeset contract:** `lib/admin/types.ts` (`Changeset`) mirrors the jsonb documented in the header of `20261110000100_sections.sql` and extended in `20261110000300_amenity_section.sql`. Rows update partially (only changed keys); new rows carry a client-generated UUID and, for exhibits, get `code = max(code)+1` inside the function. `amenities.photos` is never touched.
- **Section letter renames** apply before deletes and cannot swap (chain through a spare letter); the tool shows a note that visitors will see the new letter.
- **Not in the tool:** QR code management, TTS generation (`tools/generate-audio.py`), exhibit deletion (set `status = coming_soon`), amenity photos.
- Specs: `docs/specs/exhibit-admin-tool.md`, `docs/specs/amenity-admin.md`.

## Telemetry

Every scan logs:
- `qr_code_id` — which marker
- `timestamp` — when
- `user_id` — who (null if anonymous)
- `device_type` — iOS/Android
- `listened` — did they tap play?
- `listen_duration_sec` — engagement depth
- `ad_clicked` — conversion tracking

Aggregated views (computed nightly or on-demand):
- Scans per marker per day/week/month
- Unique users per day
- Listen rate (plays / scans)
- Ad CTR per placement per tier
- Peak hours / days

## Page Load Performance Target

| Metric | Target |
|--------|--------|
| Time to interactive | < 2 seconds |
| Total page weight | < 500KB (excl. audio) |
| Audio file size | < 500KB (64kbps mono, ~60s) |
| Time to audio start (after tap) | < 1 second |

## Security

- Admin tool: no auth. It is gated by `NODE_ENV !== 'production'` only (404 in every production build, verified on a prod build) and uses the service-role key server-side. Do not run `next dev` bound to a network interface, a staging deployment in dev mode, or any non-production preview with these routes reachable. `admin_apply_changes` is executable by `service_role` only (anon/authenticated revoked). The admin chunks are excluded from the service-worker precache (`exclude` in `next.config.ts`) so visitors never download them.
- Visitor: no auth required for content; OTP only for progress saving
- Rate limiting on OTP endpoint (prevent abuse)
- QR codes are sequential-resistant (use random short codes, not incrementing IDs)
- No PII stored beyond phone number (which is hashed after OTP verification for progress tracking)
