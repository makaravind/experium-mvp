# Nature Audio Tour

## What This Is

QR-code-based audio guide for park visitors. Scan a marker near an exhibit → mobile webapp plays 60-second audio narration. No app install.

Exhibits include: rare plants, stone structures, water bodies, and landmarks.

**First deployment:** Experium Park, Hyderabad (150 acres, ₹1000 entry, 500+ daily visitors).

## Business Model

Model B — scans (page impressions) are the product, audio is the hook. Revenue from direct-sold local ads. Physical markers sponsored one-time by local businesses.

## Key Architecture Decisions

- QR encodes permanent short code (`/s/A7X3`) → server resolves to content (indirection layer)
- Markers have NO exhibit name — only sponsor logo + QR. Allows reassignment without reprinting.
- Exhibits have a `type` field: `plant | structure | water-body | landmark`
- `scientificName` is optional (only relevant for plants)
- Webapp: Next.js, serverless, PostgreSQL, S3+CDN for audio
- Audio: AI TTS (64kbps mono, <500KB per clip), 3 languages (EN/HI/TE)
- Identity: anonymous first, OTP after 2-3 scans
- Admin/maintainer mode built into same webapp
- New exhibit codes: type prefix + number (PL01, ST01, WB01, LM01)

## GitHub

- **Always use `ghp`** (not `gh`) for all GitHub CLI operations in this repo. `ghp` uses the personal account (`makaravind`).
- **Project board:** https://github.com/users/makaravind/projects/1 — tracks all work (app + content pipeline + launch tasks). Use `ghp project` commands to manage items.

## Repository Structure

- **App source code:** `experium-ai-tour-app/` — all application code lives here. Code changes go in this folder.
- **Everything else** (docs, content generation scripts, audio assets, presentation) — lives in the repo root outside the app folder.

## Documentation

All design docs are in `/docs/`. Read `docs/README.md` for the full index.

Key files for development:
- `docs/tech-architecture.md` — DB schema, API endpoints, stack
- `docs/user-journey.md` — UI flows
- `docs/content-pipeline.md` — audio generation process
- `docs/decisions.md` — all resolved decisions

## Development Guidelines

- **v1 mentality:** Keep it simple. No over-engineering.
- **Assume connectivity is good** — don't build offline-first
- **No app store** — webapp only, PWA optional
- **Telemetry is minimal** — only track what drives a decision
- **Content pipeline is code** — build as repeatable scripts, not manual process
- **Markers are dumb, server is smart** — all logic server-side

## Open Questions

See `docs/open-questions.md` — some block development (domain name, gamification design), others block launch only.

## Stack

- Frontend: Next.js (App Router)
- Backend: Next.js API routes / serverless
- DB: PostgreSQL (Supabase or Neon)
- Audio: S3 + CloudFront
- Auth: OTP (Twilio/MSG91)
- Hosting: Vercel or Cloudflare Pages
- Content: Whisper + Claude/GPT + ElevenLabs/Google TTS
