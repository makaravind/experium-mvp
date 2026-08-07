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
| User identity | Anonymous-first. Optional name/phone/email on first load (skippable). No OTP in v1 | Zero friction; soft capture for personalization + marketing leads |
| Gamification | Yes — exhibit discovery game, shareable cards | Drives repeat scans; see gamification section below |
| Feedback | User can report wrong info / damaged markers | Crowdsourced maintenance safety net |
| Exhibit types | plant, structure, water-body, landmark | Covers all park experiences |
| Exhibit terminology | "Exhibit" (user-facing + code) | Generic term for any scannable point of interest |
| Physical marker | Called "marker" (not plate) | Works for various mounting contexts (posts, railings, walls) |

## Tech

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Developer | Solo (Aravind), AI-assisted | No hard deadline, AI pipeline for speed |
| Hosting | Vercel | Next.js first-class support, free tier sufficient |
| Frontend | Next.js (App Router) | SSR for fast first paint, React for interactivity |
| Backend | Next.js API routes (serverless) | Co-located with frontend, minimal infra |
| Database | Supabase (Postgres + Auth + Storage) | One platform replaces separate DB + auth + file storage |
| DB Client | Supabase JS only (no ORM) | Single SDK, no cold-start penalty, auto-generated types |
| Audio/File hosting | Supabase Storage | Fewer components — reuse existing platform instead of separate S3 + CloudFront |
| State management | Zustand | Lightweight (~50 lines), avoids Context re-render issues |
| Styling | Tailwind CSS + shadcn/ui | Fast iteration, accessible components, no runtime CSS |
| Map | ~~Three.js / React Three Fiber~~ **Mapbox GL JS + drone orthophoto** | Real drone ortho is more accurate than illustrated map; visitors recognize actual park landmarks |
| PWA / Service Worker | `next-pwa` | Drop-in, handles precaching + runtime caching with ~10 lines config |
| Audio strategy | Full upfront download (~25MB per language) | Simple, fully offline after first load; hybrid later if bounce is an issue |
| Admin UI | Supabase dashboard (no custom admin in v1) | Table editor + RLS sufficient; eliminates entire admin route surface |
| Admin auth | Supabase Auth (magic link) | Already in stack, ties into RLS, no password management |
| TTS service | Deferred — trial ElevenLabs / Google TTS | Not a runtime dep; manual content pipeline step |
| Offline UX (first load) | Blocker screen if no network + retry button | App is useless without audio; don't over-engineer partial states |
| Offline UX (missing audio) | Inline error message + log to analytics | Simple, no retry loop or fallback TTS |
| QR URL scheme | `domain.com/s/{SHORT_CODE}` → server redirect | Indirection allows remapping without reprinting markers |
| Audio format | Pre-compressed speech (64kbps mono, ~500KB/min) | Loads in 2-3 sec even on weak 4G, no streaming needed |
| Connectivity | ~~Assume good~~ **Offline after initial load** | First load downloads all assets (~25MB for selected language); service worker caches for full offline park visit |
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
| Exhibit category system | A/B/C tier (orthogonal to type enum) | Drives content investment, sponsor pricing, and user-facing differentiation (audio length, pin prominence) |

## Gamification

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Progress display | Horizontal trail with milestones shown post-audio (combined with Scan Now + Explore) | Single "Keep Exploring" screen — no dead-end; user always has next action visible |
| Trail scope | Shows current segment (last milestone → next milestone) | Compact horizontal bar, not overwhelming |
| Milestones | 1, 3, 5, 10, 15, 20, 30, 40, 50 exhibits | Frequent early milestones hook users fast; spacing increases as engagement deepens |
| Milestone celebration | Full-screen takeover with confetti + badge reveal at every milestone | Every milestone feels like an event |
| Discovery cards | Shareable Instagram-style card unlocked at milestones 10 and 50 | Big rewards at key thresholds; cards = organic marketing |
| Post-audio primary CTA | "Scan Now" — opens phone camera | Most natural next action; user is already in the park near markers |
| Post-audio secondary | Collapsible "Explore the park" section with illustrated map | Discoverable but not in the way of scanning flow |
| Park map style | ~~Stylized illustrated SVG~~ **Drone orthophoto raster tileset on Mapbox** | Real photo; visitors see actual trees, paths, water bodies. Illustrated SVG dropped. |
| Map suggestions | 5 curated unvisited exhibits shown as pins, rotate as completed | Enough choice without decision fatigue |
| Navigation | ~~Text/photo hint only~~ **GPS "You are here"** — live blue accuracy circle on Three.js map via `watchPosition()` | ~~No GPS dependency in v1~~ **OVERRIDDEN** — GPS is v1 scope; PWA evaluation confirms feasibility |
| Trail routing model | **Segment graph + BFS** — draw physical trail segments once, chain via BFS for any A→B route | Cross-product (one polyline per landmark pair) = N×(N-1)/2 hand-drawn paths (190 for 20 exhibits); segment model needs ~15–30 segments total. See `docs/interactive-map.md § Trail Routing` |
| Nearby exhibit highlights | Unvisited pins within 50m (max 5) pulse + 1.3× scale on map; Category A guaranteed a slot | Drives next scan naturally via map visual cues, no extra UI |
| Curated path | Fixed recommended route designed editorially | Complements GPS — editorial curation for "what to see" vs GPS for "what's close" |
| Exhibit categories | A/B/C tier per exhibit, manually assigned, default B | A = longer audio (90s) + larger pin (1.3×) + nearby priority + persists at low zoom. C = 60s audio, standard pin, hides at low zoom. Reassign from real data after 2-4 weeks |
| User info capture | Optional modal on first load (name, phone, email) + skip link | No OTP in v1. Stored locally, synced when online. Never re-shown if skipped; Discovery Card shows "Your Name Here" tap-to-edit at milestone 10 |
