# Design

## Mascot — Pip

Specs: `docs/specs/animated-pip-mascot.md`, `docs/specs/pip-mascot-bigger.md`. Decision: `docs/decisions.md § Pip mascot`.

The park mascot is **Pip**, wobnimo's built-in songbird chick (default palette: yellow/cream body). One component, `PipMascot`, renders it everywhere; it shows a static poster (`public/pip.webp`) until the live WebGL canvas is ready, and keeps the poster on no-WebGL2 or reduced motion. Decorative only (`aria-hidden`). The old squirrel is retired.

| Spot | Size | State |
|------|------|-------|
| `PreviewSheet`, collapsed | 108×108, perched on the sheet's top-right edge (lifted 70 px, feet at the handle row) | `speaking` while audio plays, else reaction (`surprised` / `celebrating` / `sad`), else `idle` |
| `PreviewSheet`, expanded | 110×110, straddling the gallery's bottom-right edge | same state as the collapsed Pip; crossfades with it |
| `AmenitySheet` (collapsed / expanded) | same as above | `idle` (no audio); tap + sleep only |
| `TrailCard` | 104×104, perched on the card's top edge, left of the ⓘ button | `idle`; `celebrating` ~3s when the discovered total rose since last celebrated |
| `LoadingScreen` | 112×112 | `thinking`, on bare matcha (no tile) |

Behaviours (all spots except `LoadingScreen`, which stays non-interactive):

- **Tap:** hops and spins (wobnimo `poke()`); the tap doesn't close the sheet or reach the map. Poster-only (reduced motion / no WebGL2): no tap reaction.
- **Sleep:** an `idle` Pip falls asleep after 20 s with no tap or state change; a tap or any state change wakes it.
- **Reactions:** `surprised` 1.2 s when the sheet opens / a new exhibit is selected; `celebrating` 2 s when audio ends; `sad` 3 s on audio fallback or the "Needs internet" banner; `speaking` always wins.
- **Perch hiding:** the collapsed perch is hidden while the sheet is expanded or parked (no exhibit); the expanded Pip is hidden while collapsed.
