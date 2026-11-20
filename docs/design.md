# Design

## Mascot — Pip

Spec: `docs/specs/animated-pip-mascot.md`. Decision: `docs/decisions.md § Pip mascot`.

The park mascot is **Pip**, wobnimo's built-in songbird chick (default palette: yellow/cream body). One component, `PipMascot`, renders it everywhere; it shows a static poster (`public/pip.webp`) until the live WebGL canvas is ready, and keeps the poster on no-WebGL2 or reduced motion. Decorative only (`aria-hidden`). The old squirrel is retired.

| Spot | Size | State |
|------|------|-------|
| `SheetSummary` in `PreviewSheet` | 62×72 | `speaking` while audio plays, else `idle` |
| `SheetSummary` in `AmenitySheet` | 62×72 | `idle` (no audio) |
| `TrailCard` | 48×56 | `idle`; `celebrating` ~3s when the discovered total rose since last celebrated |
| `LoadingScreen` | 112×112 | `thinking`, on bare matcha (no tile) |
