# Flow 6: Gamification — Progress Trail & Discovery Cards

## Version: V1

## Summary

Horizontal trail bar tracks exhibit discovery progress. Completed milestone nodes are tappable to revisit celebrations. Every milestone mints a Discovery Card, collected in a dedicated `/collection` route (fanned stack).

---

## Trail Progress Bar

### Location

- Home screen (top section)
- Post-audio "Keep Exploring" state (Flow 1, S4 context)

### Behavior

| Element | Details |
|---------|---------|
| Shape | Horizontal bar with milestone nodes |
| Scope | Shows current segment: last achieved milestone → next milestone |
| Completed nodes | Filled, green (#588157). Tappable → replays card reveal at `/collection?reveal={m}` |
| Upcoming nodes | Hollow, muted (#a3b18a). Not tappable |
| Progress fill | Green line fills between completed nodes |

---

## Card Reveal (revisit)

When user taps a completed milestone node on the trail bar:

| Element | Details |
|---------|---------|
| Screen | Navigates to `/collection?reveal={m}` (same tap-to-flip reveal as the post-audio milestone cross) |
| Content | Face-down card, tap or 2s auto-flip, one confetti burst, badge color + milestone number |
| Replay | Plays every time, for any of the 9 milestones (no "seen" tracking) |
| Continue | "Continue →" drops the query param (`router.replace`) and shows the fanned stack |

---

## Discovery Cards

### Trigger

- All 9 trail milestones (1, 3, 5, 10, 15, 20, 30, 40, 50) mint a card
- Post-audio milestone cross → navigates to `/collection?reveal={m}` (tap-to-flip, auto-flips after 2s)
- Trail bar tap on earned node → same reveal, replays every time

### Card Content

| Element | Details |
|---------|---------|
| Badge image | Static image of the milestone badge achieved |
| Park mention | Text: "Visited Experium Park" (or similar) |
| Personalization | If user provided name (first-load modal or tap-to-edit on card): shows name on card. Otherwise: "Your Name Here" placeholder with tap-to-edit field |

### Interaction

| Step | Action |
|------|--------|
| 1 | After reveal, "Continue →" lands on fanned stack of all earned cards (or open `/collection` via Home "My Collection" link) |
| 2 | User taps a card in the stack → full-screen view (name editable here) |
| 3 | "Download" button below card |
| 4 | Tapping Download saves PNG to device camera roll / downloads folder |
| 5 | User shares manually via their preferred app (WhatsApp, Instagram, etc.) |

### Collection

- Dedicated `/collection` route (outside map shell, no TabBar). Back caret → Home.
- Membership derived from `totalDiscovered` (achieved milestones); no separate persisted card state.
- Fanned stack shows only earned cards; name edit is shared across all cards (`userInfo.name`).

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| User dismisses celebration without downloading card | Card accessible later via trail bar tap on that milestone |
| Download fails | Show retry button. "Couldn't save image. Try again?" |
| User hasn't reached milestone 10 yet | No card CTA anywhere. Trail just shows progress |

---

## Data Requirements

| Element | Data Needed |
|---------|-------------|
| Trail bar | milestones_achieved[], current_count, next_milestone |
| Celebration overlay | milestone_number, badge_image_url |
| Discovery Card | badge_image_url, park_name, card_template, user_name (from localStorage, nullable) |

---

## Design Tokens

Same as Flow 1 global tokens. No additional tokens needed.
