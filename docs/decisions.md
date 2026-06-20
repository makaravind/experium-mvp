# Resolved Decisions

Source of truth for all design decisions made during initial planning.

## Product

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary medium | Audio | Hands-free, eyes-free — visitor focuses on the plant visually |
| Platform | Mobile webapp (no install) | Any friction kills scan rate in a casual park setting |
| PWA | Optional upgrade for engaged users | Persistent progress, offline caching, more park info |
| Screen content | Content-light before play (photo + name + listen button) | Audio IS the content; too much text = nobody presses play |
| Post-audio | Text details available after listening | Reward for engagement, doesn't compete with audio |
| Language | English + Hindi + Telugu | Matches Hyderabad visitor demographic |
| Language selection | Visible dropdown at top, user picks before pressing listen | Explicit choice, no autodetect |
| User identity | Anonymous first scan, OTP prompt after 2-3 scans | Zero friction on first touch, identity needed for gamification |
| Gamification | Yes — plant identification game, shareable cards | Drives repeat scans; details TBD |
| Feedback | User can report wrong info / damaged plates | Crowdsourced maintenance safety net |

## Tech

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Developer | Solo (Aravind), AI-assisted | No hard deadline, AI pipeline for speed |
| Stack | Next.js or similar, serverless backend, Postgres DB | Simple, low concurrent load (~50 simultaneous max) |
| QR URL scheme | `domain.com/s/{SHORT_CODE}` → server redirect | Indirection allows remapping without reprinting plates |
| Audio format | Pre-compressed speech (64kbps mono, ~500KB/min) | Loads in 2-3 sec even on weak 4G, no streaming needed |
| Connectivity | Assume good (v1) | Hyderabad urban area, don't over-engineer |
| Admin data | Proper database | Reports, reviews, state tracking needed |
| Telemetry | Scans/plate/day, unique users, listen rate, ad CTR | Only metrics that drive a decision |

## Business

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Business model | Model B — scans are the product | Page impressions = revenue; audio is the hook |
| Ad format | Display banner + splash screen + post-audio | User sees screen (plant photo), not fully eyes-off |
| Ad source | Direct-sold local ads (no AdSense for v1) | 2500 impressions/day too low for networks; hyper-local context = 10-50x better CPM |
| Physical sponsors | One-time goodwill placement | Part of initial investment, no recurring fees or performance guarantees |
| Digital ad tiers | Gold/silver/bronze by geo-location | Closer to high traffic = higher tier |
| Initial ad pricing | Based on location (no impression data yet) | Adjust to impression-based once data exists |
| Ad revenue split | 100% to us until initial costs recouped, then split with park | De-risks investment |
| Brand | "Nature Audio Tour" (working title), own brand | Platform play; park is a client, not the brand owner |

## Operations

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Plate material | Aluminum (5+ year durability) | Weatherproof, outdoor park environment |
| Plate content | Sponsor logo + QR code only | No plant name = no reprint needed if plant changes |
| Plate size | ~A5 (8"x6") estimated | Big enough for QR + logo, small enough to not be an eyesore |
| Maintenance roles | Admin (approves spend) + Maintainer (field checks) | Two-role, keep simple |
| Plate states | Active / Needs attention / Inactive | Start simple, add states when pain is felt |
| Maintenance tool | Admin mode in same webapp (maintainer scans QR → sees checklist) | Zero extra tooling cost |
| Audit frequency | Quarterly walk-through by maintainer + user reports as safety net | 50 plates = 30 min walk |

## Content

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Source content | Expert interview, captured in English | Domain knowledge from botanist/park expert |
| Script creation | AI extracts per-plant scripts from raw interview | Repeatable, fast |
| Translation | AI (LLM) translates English → Hindi, Telugu | Cheap, fast, easily add languages later |
| Voice generation | AI TTS (ElevenLabs / Google Cloud TTS) | No guide character needed; informational tone |
| Pipeline design | Built as repeatable script/tool | Reusable for content updates and future parks |
