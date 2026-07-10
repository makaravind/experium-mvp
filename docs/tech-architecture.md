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
Example:     https://natureaudiotour.in/s/A7X3

/s/{code}  → visitor experience (resolve + render)
/admin     → admin dashboard (protected)
/api/*     → backend API
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
| Map | Mapbox GL JS v3 + drone orthophoto tileset | Real ortho raster over Mapbox basemap; exhibit pins as GeoJSON; GPS "you are here" via watchPosition() |
| PWA / Offline | `next-pwa` (full upfront ~25MB download) | Offline-first after initial load; all audio cached via service worker |
| Auth (admin) | Supabase Auth (magic link) | Already in stack, RLS integration, no password management |
| Auth (visitor) | None in v1 (optional info capture, no OTP) | Plain inputs stored locally, synced to server when online |
| Admin UI | Supabase dashboard (no custom admin in v1) | Table editor + RLS = sufficient for solo dev + maintainer |
| Analytics | Custom (DB writes) | Simple scan logging, no third-party needed |
| TTS | Deferred (ElevenLabs / Google TTS per batch) | Not a runtime dep — manual content pipeline step |

**External services: 2** — Vercel (hosting) + Supabase (everything else).

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

## API Endpoints

### Public (Visitor)

```
GET  /s/{code}              → Resolve QR, render exhibit page (SSR)
GET  /api/exhibit/{id}      → Exhibit data + audio URLs
POST /api/scan              → Log a scan event
POST /api/report            → Submit issue report
POST /api/user/info         → Save optional user details (name/phone/email)
GET  /api/progress          → User's discovered exhibits
GET  /api/exhibits/all      → All exhibit metadata + coords (for offline cache)
```

### Admin

No custom admin UI in v1. All admin operations (CRUD on exhibits, QR codes, reports, ads) done directly via Supabase dashboard with RLS policies restricting access to authenticated admin users.

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

- Admin routes: auth-protected (session cookie or JWT)
- Visitor: no auth required for content; OTP only for progress saving
- Rate limiting on OTP endpoint (prevent abuse)
- QR codes are sequential-resistant (use random short codes, not incrementing IDs)
- No PII stored beyond phone number (which is hashed after OTP verification for progress tracking)
