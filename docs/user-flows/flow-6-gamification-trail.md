# Flow 6: Gamification — Progress Trail & Discovery Cards

## Version: V1

## Summary

Horizontal trail bar tracks exhibit discovery progress. Completed milestone nodes are tappable to revisit celebrations. Discovery Cards (downloadable images) unlock at milestones 10 and 50.

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
| Completed nodes | Filled, green (#588157). Tappable → opens milestone celebration overlay (S5 from Flow 1) |
| Upcoming nodes | Hollow, muted (#a3b18a). Not tappable |
| Progress fill | Green line fills between completed nodes |

---

## Milestone Celebration (revisit)

When user taps a completed milestone node on the trail bar:

| Element | Details |
|---------|---------|
| Screen | Same full-screen overlay as Flow 1, S5 |
| Content | Badge, confetti animation, milestone label, count |
| Discovery Card CTA | Visible only for milestones 10 and 50 |
| Dismiss | Tap anywhere or X → returns to previous screen |

---

## Discovery Cards

### Trigger

- Milestone celebration screen at milestones 10 and 50 (via post-audio S5 OR trail bar tap)

### Card Content

| Element | Details |
|---------|---------|
| Badge image | Static image of the milestone badge achieved |
| Park mention | Text: "Visited Experium Park" (or similar) |
| Personalization | If user provided name (first-load modal or tap-to-edit on card): shows name on card. Otherwise: "Your Name Here" placeholder with tap-to-edit field |

### Interaction

| Step | Action |
|------|--------|
| 1 | User taps "Your Discovery Card is ready!" CTA on celebration screen |
| 2 | Card preview shown (full-screen, centered) |
| 3 | "Download" button below card |
| 4 | Tapping Download saves PNG to device camera roll / downloads folder |
| 5 | User shares manually via their preferred app (WhatsApp, Instagram, etc.) |

### No persistence

- Card is not stored in-app. No "My Cards" section.
- User can re-access by tapping the completed milestone 10 or 50 node on trail bar → celebration → card CTA

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
