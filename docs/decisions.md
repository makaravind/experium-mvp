# Resolved Decisions

Source of truth for all design decisions made during initial planning.

## Product

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary medium | Audio | Hands-free, eyes-free — visitor focuses on the exhibit visually |
| Platform | Mobile webapp (no install) | Any friction kills scan rate in a casual park setting |
| PWA | Optional upgrade for engaged users | Persistent progress, offline caching, more park info |
| Screen content | Content-light before play (photo + name + listen button) | Audio IS the content; too much text = nobody presses play |
| Post-audio | Text details available after listening | Reward for engagement, doesn't compete with audio |
| Language | English + Hindi + Telugu | Matches Hyderabad visitor demographic |
| Language selection | Visible dropdown at top, user picks before pressing listen | Explicit choice, no autodetect |
| User identity | Anonymous first scan, OTP prompt after 2-3 scans | Zero friction on first touch, identity needed for gamification |
| Gamification | Yes — exhibit discovery game, shareable cards | Drives repeat scans; details TBD |
| Feedback | User can report wrong info / damaged markers | Crowdsourced maintenance safety net |
| Exhibit types | plant, structure, water-body, landmark | Covers all park experiences |
| Exhibit terminology | "Exhibit" (user-facing + code) | Generic term for any scannable point of interest |
| Physical marker | Called "marker" (not plate) | Works for various mounting contexts (posts, railings, walls) |

## Tech

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Developer | Solo (Aravind), AI-assisted | No hard deadline, AI pipeline for speed |
| Stack | Next.js or similar, serverless backend, Postgres DB | Simple, low concurrent load (~50 simultaneous max) |
| QR URL scheme | `domain.com/s/{SHORT_CODE}` → server redirect | Indirection allows remapping without reprinting markers |
| Audio format | Pre-compressed speech (64kbps mono, ~500KB/min) | Loads in 2-3 sec even on weak 4G, no streaming needed |
| Connectivity | Assume good (v1) | Hyderabad urban area, don't over-engineer |
| Admin data | Proper database | Reports, reviews, state tracking needed |
| Telemetry | Scans/marker/day, unique users, listen rate, ad CTR | Only metrics that drive a decision |
| Code scheme (new exhibits) | Type prefix + number (PL01, ST01, WB01, LM01) | Distinguishes exhibit types at a glance |
| Code scheme (existing) | Keep as-is (NM01, BN02, etc.) | Already in use, migrate later |

## Business

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Business model | Model B — scans are the product | Page impressions = revenue; audio is the hook |
| Ad format | Display banner + splash screen + post-audio | User sees screen (exhibit photo), not fully eyes-off |
| Ad source | Direct-sold local ads (no AdSense for v1) | 2500 impressions/day too low for networks; hyper-local context = 10-50x better CPM |
| Physical sponsors | One-time goodwill placement | Part of initial investment, no recurring fees or performance guarantees |
| Digital ad tiers | Gold/silver/bronze by geo-location | Closer to high traffic = higher tier |
| Initial ad pricing | Based on location (no impression data yet) | Adjust to impression-based once data exists |
| Ad revenue split | 100% to us until initial costs recouped, then split with park | De-risks investment |
| Brand | "Nature Audio Tour" (working title), own brand | Platform play; park is a client, not the brand owner |

## Operations

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Marker material | Aluminum (5+ year durability) | Weatherproof, outdoor park environment |
| Marker content | Sponsor logo + QR code only | No exhibit name = no reprint needed if exhibit changes |
| Marker size | ~A5 (8"x6") estimated | Big enough for QR + logo, small enough to not be an eyesore |
| Maintenance roles | Admin (approves spend) + Maintainer (field checks) | Two-role, keep simple |
| Marker states | Active / Needs attention / Inactive | Start simple, add states when pain is felt |
| Maintenance tool | Admin mode in same webapp (maintainer scans QR → sees checklist) | Zero extra tooling cost |
| Audit frequency | Quarterly walk-through by maintainer + user reports as safety net | 50 markers = 30 min walk |

## Content

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Source content | Expert interview, captured in English | Domain knowledge from botanist/park expert(s) |
| Script creation | AI extracts per-exhibit scripts from raw interview | Repeatable, fast |
| Translation | AI (LLM) translates English → Hindi, Telugu | Cheap, fast, easily add languages later |
| Voice generation | AI TTS (ElevenLabs / Google Cloud TTS) | No guide character needed; informational tone |
| Pipeline design | Built as repeatable script/tool | Reusable for content updates and future parks |
| scientificName field | Optional (null for non-plant exhibits) | Only plants have scientific names |
| Discovery counter | Flat ("X exhibits discovered"), not type-aware | Simple v1, per-type badges in v2 |
