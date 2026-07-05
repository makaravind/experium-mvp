# Nature Audio Tour

QR-code-based audio guide for park visitors. Scan marker → webapp plays audio narration. No app install. First deployment: Experium Park, Hyderabad.

## GitHub

- **Personal account:** `makaravind`. To run GitHub CLI commands for this repo:
  1. `gh auth switch --hostname github.com --user makaravind`
  2. Run your commands (`gh issue`, `gh project`, `gh api`, etc.)
  3. Switch back: `gh auth switch --hostname github.com --user ametku`
- **Project board:** https://github.com/users/makaravind/projects/1
- **Milestones:** `gh api repos/makaravind/experium-ai-tour-app/milestones`
- **Local cache:** `.claude/current-milestone.md` — read before hitting API.

## Repository Structure

- `experium-ai-tour-app/` — all application code. Code changes go here.
- `docs/` — all design docs, decisions, specs.
- `references/` — design refs, Open Design prompts.
- `mvp/` — early prototype (static audio player).

## Documentation Index

### Architecture & Decisions
- `docs/tech-architecture.md` — DB schema, API endpoints, stack
- `docs/decisions.md` — all resolved decisions
- `docs/open-questions.md` — unresolved items by urgency

### User Experience
- `docs/user-journey.md` — high-level visitor flows
- `docs/design.md` — full design system
- `docs/user-flows/flow-1-qr-scan-to-exhibit.md` — core flow (loading → map → audio → milestone)
- `docs/user-flows/flow-5-home-screen.md` — home tab
- `docs/user-flows/flow-6-gamification-trail.md` — trail, milestones, discovery cards
- `docs/user-flows/flow-7-report-issue.md` — issue reporting

### Map & GPS
- `docs/interactive-map.md` — Three.js/R3F spec, GPS, nearby highlights
- `docs/pwa-vs-native-evaluation.md` — PWA feasibility (GPS, audio, offline)

### Business & Operations
- `docs/revenue-model.md` — CPM pricing, ad tiers, projections
- `docs/operations.md` — marker lifecycle, maintenance
- `docs/park-partnership-brief.md` — pitch to park
- `docs/partnership-saas-model.md` — alternative SaaS model (internal)

### Content
- `docs/content-pipeline.md` — audio generation (interview → script → TTS)
- `docs/content-review-66-beyond.md` — park content review
- `docs/gamification-badges.md` — milestone badges

### References
- `references/opendesign-flow-prompts.md` — prompts to regenerate UI screens

## Development Guidelines

- **v1 mentality:** Keep it simple. No over-engineering.
- **Offline after initial load** — service worker caches everything on first visit.
- **Markers are dumb, server is smart** — all logic server-side.
- **Content pipeline is code** — repeatable scripts, not manual process.
