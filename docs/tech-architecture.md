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
| Frontend | Next.js (App Router) | SSR for fast first paint, React for interactivity |
| Backend | Next.js API routes or serverless functions | Minimal infra, co-located with frontend |
| Database | PostgreSQL (Supabase or Neon) | Managed, free tier sufficient for v1 |
| Audio hosting | S3 + CloudFront | Cheap, fast, global CDN |
| Auth (admin) | Simple password or Supabase Auth | Only you and maintainer need access |
| Auth (visitor) | OTP via Twilio/MSG91 | Indian phone numbers, cheap SMS |
| Hosting | Vercel or Cloudflare Pages | Free tier handles this traffic easily |
| Analytics | Custom (DB writes) | Simple scan logging, no third-party needed |

## Database Schema (High-Level)

### Core Tables

```sql
exhibits
  id            UUID PK
  name          TEXT          -- "Neem Tree", "Ancient Stone Arch", "Lotus Lake"
  type          ENUM (plant, structure, water_body, landmark)
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
  phone         TEXT UNIQUE
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
POST /api/auth/otp/send     → Send OTP to phone
POST /api/auth/otp/verify   → Verify OTP, create session
GET  /api/progress          → User's discovered exhibits (authed)
```

### Admin (Protected)

```
GET  /admin                      → Dashboard
GET  /admin/qr-codes             → All QR codes with status
GET  /admin/reports              → All reports
PUT  /admin/qr-codes/{id}       → Update mapping/status
PUT  /admin/reports/{id}        → Update report status
GET  /admin/analytics            → Scan stats, ad performance
POST /admin/exhibits             → Add new exhibit
PUT  /admin/exhibits/{id}        → Update exhibit info
POST /admin/ads                  → Add new ad
```

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
