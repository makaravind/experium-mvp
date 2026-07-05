# Flow 5: Home Screen

## Version: V1

## Summary

Home is the default landing tab. Shows trail progress, scan CTA, explore link, and ads. Motivates users to keep scanning.

---

## Screen Layout

### Fresh User (0 exhibits discovered)

| Element | Position | Details |
|---------|----------|---------|
| Trail progress | Top section | Empty trail bar. Motivational text: "Start your trail! Discover 50 exhibits to earn all badges" |
| Next milestone | Below trail | "1 exhibit to your first milestone!" |
| Scan Now button | Center, prominent | Primary CTA, green (#588157). Tapping opens camera immediately |
| Explore the Park | Below Scan | Text link/button. Tapping navigates to Map tab |
| Banner ad | Bottom | Static display banner, persistent |
| Tab bar | Fixed bottom | Home (active) · Scan · Map |

### Returning User (1+ exhibits discovered)

| Element | Position | Details |
|---------|----------|---------|
| Trail progress | Top section | Horizontal trail bar showing current segment (last milestone → next milestone). Filled nodes = achieved, hollow = upcoming |
| Progress count | Below trail | "X/50 discovered · Y more to next badge!" |
| Scan Now button | Center, prominent | Primary CTA, green (#588157). Tapping opens camera immediately |
| Explore the Park | Below Scan | Text link/button. Tapping navigates to Map tab |
| Banner ad | Bottom | Static display banner, persistent |
| Tab bar | Fixed bottom | Home (active) · Scan · Map |

---

## Interactions

| Action | Result |
|--------|--------|
| Tap Scan Now | Camera opens immediately (no intermediate screen). After QR decoded → switches to Map tab → zoom to pin → bottom sheet (Active state) |
| Tap Explore the Park | Navigates to Map tab |
| Tap Scan tab (tab bar) | Camera opens immediately |
| Tap Map tab (tab bar) | Navigates to Map tab |

---

## State Management

- Trail progress reads from localStorage. Synced to server if user provided info on first-load modal
- Home does NOT update in real-time after audio ends — user stays on Map post-audio. Home reflects latest state when user navigates back to it

---

## Ad Placement

| Placement | Format | Position |
|-----------|--------|----------|
| Banner ad | Static display banner | Bottom of content, above tab bar |

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| All 50 exhibits discovered | Trail complete. Show: "You've discovered all 50 exhibits! 🎉" + Discovery Card CTA if available |
| No network (cached data) | Home renders from cached progress. Scan button still works (camera opens, QR reads exhibit code from URL) |
| First launch (pre-onboarding) | User doesn't see Home first — they see the loading screen (asset download + language picker + optional info modal). Home appears after onboarding completes and user taps Home tab |

---

## Data Requirements

| Element | Data Needed |
|---------|-------------|
| Trail progress | total_discovered, current_milestone, next_milestone, milestones_achieved[] |
| Fresh user CTA | Static copy (no data) |
| Banner ad | ad_config (home_banner) |

---

## Design Tokens

Same as Flow 1 global tokens. No additional tokens needed.
