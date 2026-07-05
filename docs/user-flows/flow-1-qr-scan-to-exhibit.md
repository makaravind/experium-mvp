# Flow 1: QR Scan → Exhibit Audio

## Version: V1

## Summary

User scans a QR code (physical marker or in-app camera) → map zooms to exhibit → bottom sheet with audio player → full-screen audio experience → return to map.

---

## Entry Paths

### A — Onboarded at Ticket Counter (happy path)

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Camera | Scans QR on physical ticket | Opens app URL on park WiFi |
| 2 | Loading Screen | Waits | Progress bar + language picker. Downloads all assets: map data + exhibit metadata + audio for selected language (~25MB). GPS permission requested |
| 3 | Loading Screen | Picks language | Audio files for that language begin downloading. Progress bar updates |
| 4 | Info Modal | Views optional form | Modal: name, phone, email fields + "Continue" button + "Skip for now" link. All fields optional |
| 5 | Info Modal | Fills in details OR taps Skip | If filled: stored in localStorage (synced to server when online). If skipped: never shown again |
| 6 | Map (zoomed to entrance) | Views map | Map renders (Three.js), zoomed to park entrance. Blue GPS accuracy circle shows user position. Nearby unvisited pins within 50m pulse + enlarged. All 50 pins loaded |

### B — Cold Scan (no prior onboarding)

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Camera | Scans exhibit QR marker directly | Browser opens `/s/{code}` |
| 2 | Loading Screen | Waits | Progress bar + language picker. Downloads all assets (~25MB). GPS permission requested |
| 3 | Info Modal | Views optional form | Modal: name, phone, email + Skip. All optional |
| 4 | Info Modal | Fills or skips | Stored locally or dismissed permanently |
| 5 | Map + Sheet | Views | Map loads with GPS dot (blue accuracy circle). Camera flies to scanned exhibit. Bottom sheet slides up (Active state). Nearby unvisited pins pulse |

### C — In-App Scan (Scan tab or Home button)

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Any screen | Taps Scan tab | Camera viewfinder opens immediately (no intermediate screen) |
| 2 | Camera | Points at exhibit QR marker | QR detected and decoded |
| 3 | Map | — | Map animates: zoom to scanned exhibit pin (pin highlights) |
| 4 | Map + Bottom Sheet | Views sheet | Bottom sheet slides up from bottom with exhibit details |

---

## Screen States

### S1: Map (Base Layer)

- **Technology:** Three.js rendered park map
- **Default zoom:** Entrance area (first visit) or last-viewed area (returning)
- **Pins:** All 50 exhibit pins loaded. Orange (#dda15e) for unvisited, green (#588157) for visited
- **Pin sizing:** Category A pins render 1.3× standard size. Category C pins hide at low zoom levels
- **GPS dot:** Blue translucent accuracy circle showing user's live position via `watchPosition()`
- **Nearby highlights:** Unvisited pins within 50m of GPS position (max 5) get pulse animation + 1.3× scale. Category A guaranteed a slot in the 5
- **Interaction:** Pinch-to-zoom, pan, tap pin
- **Tab bar:** Persistent at bottom — Home | Scan | Map (active)
- **On pin tap:** → transitions to S2 (Preview state)
- **On QR scan:** → zoom animation to pin → transitions to S2 (Active state)

### S2: Bottom Sheet — Compact (two states)

Slides up from bottom, map visible behind (dimmed slightly).

#### State A: Active (user scanned QR — they ARE at the exhibit)

| Element | Details |
|---------|---------|
| Grab handle | Horizontal bar at top for drag |
| Exhibit photo | Square thumbnail, left-aligned |
| Exhibit name | Bold, e.g., "Neem Tree" |
| Exhibit type badge | Small pill: "Plant" / "Structure" / "Water Body" / "Landmark" |
| Category indicator | Category A exhibits: subtle "Featured" label or star icon. B/C: no indicator |
| Language toggle | Compact: EN | HI | TE (current highlighted) |
| Listen button | Primary CTA, large, green (#588157). Icon: ▶ |
| Sponsor overlay | Dismissible overlay on map behind sheet (2-3s auto-collapse OR tap X). Impression logged on render |
| Dismiss | Swipe down or tap map area above sheet |

#### State B: Preview (user tapped pin on map — they are NOT at exhibit)

| Element | Details |
|---------|---------|
| Grab handle | Horizontal bar at top for drag |
| Exhibit photo | Square thumbnail, left-aligned |
| Exhibit name | Bold |
| Exhibit type badge | Small pill |
| Distance/wayfinding hint | "Near the lake entrance · 5 min walk" |
| Listen button | Primary CTA, large, green (#588157). User can listen remotely |
| Navigate button | Secondary button style, green outline. Behavior TBD (see Open Decisions) |
| Dismiss | Swipe down or tap map area above sheet |

**Note:** Tapping a visited (green) pin shows the same Preview sheet with Listen button (allows re-listening).

**How system determines state:** URL contains `/s/{code}` = Active (triggers sponsor overlay). Pin tap from map = Preview (no sponsor overlay).

**Key difference:** Active state triggers sponsor ad overlay on map. Preview does not. Audio access is identical in both states.

### S3: Full-Screen Audio Player

Triggered when user taps Listen in S2 (either Active or Preview state). Bottom sheet slides up to full screen.

**Audio player style:** Circular progress ring around a 3D play/pause button (minimal — no scrubber bar, no skip buttons). Shows elapsed/total time below. Designed for short 60-90s clips that users listen straight through.

| Element | Position | Details |
|---------|----------|---------|
| Close button (X) | Top-right | Collapses back to S2, pauses audio |
| Exhibit photo(s) | Top half | Large hero image, swipeable gallery if multiple photos |
| Exhibit name | Below photo | Large bold text |
| Scientific name | Below name | Italic, muted color. Only for plants (null otherwise) |
| Audio progress bar | Center | Scrubable, shows elapsed/total time (e.g., 0:34 / 1:12) |
| Play/Pause button | Center, large | Toggle |
| Language toggle | Below progress bar | EN | HI | TE — switching reloads audio, restarts playback |
| Banner ad | Below audio controls | Sponsor banner (display ad) |
| "Learn More" (collapsed) | Below ad | Expandable text section — additional exhibit details. Available during and after audio |
| Post-audio ad | Appears when audio ends | Larger ad placement, appears below audio controls |

### S4: Post-Audio (sheet collapse + toast)

Triggered when audio reaches end.

| Step | Duration | What happens |
|------|----------|--------------|
| 1 | 0s | Audio ends. Full-screen sheet auto-collapses to compact state |
| 2 | 0.3s | Sheet collapses. Map visible. Scanned pin changes from orange → green (visited) |
| 3 | 0.5s | Toast notification slides in from top: "+1 🌿 · X/50 discovered" (3s auto-dismiss) |
| 4 | 1s | If milestone reached → S5 (Celebration). Otherwise, user is on map, free to act |

### S5: Milestone Celebration (interrupt overlay)

Full-screen overlay on top of map. Only triggers at milestones (1, 3, 5, 10, 15, 20, 30, 40, 50).

| Element | Details |
|---------|---------|
| Background | Gradient green (#5d8a59 → #456b41), covers full screen |
| Confetti | Animated particles (CSS/JS) |
| Badge | Circular, centered. Dashed border ring + solid core with icon |
| Milestone label | "MILESTONE REACHED" (caps, muted) |
| Count | "Explorer — 10 Discovered!" (large, bold, white) |
| Discovery Card CTA | Only at milestones 10 and 50: "📸 Your Discovery Card is ready!" (button → navigates to Card screen) |
| Dismiss | Tap anywhere OR X button top-right → returns to Map screen |

---

## Transitions

```
                    ┌─────────────────────────────────┐
                    │                                 │
                    ▼                                 │
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────┴─────┐
│ Map (S1) │───▶│ Sheet    │───▶│ Fullscr  │───▶│ Post-    │
│          │    │ Compact  │    │ Audio    │    │ Audio    │
│          │◀───│ (S2)     │◀───│ (S3)     │    │ (S4)     │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     ▲                                               │
     │               ┌──────────┐                    │
     │               │ Milestone│                    │
     └───────────────│ (S5)     │◀───────────────────┘
                     └──────────┘      (if milestone)
```

| From | To | Trigger | Animation |
|------|----|---------|-----------|
| S1 → S2 (Active) | QR scan detected | Map zoom to pin (0.8s ease) + sheet slide up (0.3s) |
| S1 → S2 (Preview) | Pin tap | Sheet slide up (0.3s) |
| S2 → S3 | Tap Listen | Sheet expand to full screen (0.4s spring) |
| S3 → S2 | Tap X (mid-audio) | Sheet collapse (0.3s), audio pauses |
| S3 → S4 | Audio ends | Auto-collapse (0.5s) |
| S4 → S5 | Milestone reached | Celebration overlay fades in (0.4s) |
| S4 → S1 | No milestone | User is on map, free to act |
| S5 → S1 | Tap dismiss / X | Overlay fades out (0.3s), map visible |

---

## Sponsor/Ad Placements (Flow 1)

| Placement | Timing | Format | Duration |
|-----------|--------|--------|----------|
| Map overlay | Sheet slides up after QR scan | Dismissible banner/card on map behind sheet | 2-3s auto-collapse OR tap X |
| Banner ad | During audio (S3) | Static display banner below audio controls | Persistent during audio |
| Post-audio ad | Audio ends, before collapse | Larger display ad | Visible until sheet collapses |

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| QR code is inactive/unmapped | Show fallback screen: "Content coming soon for this exhibit." + CTA: "Explore other exhibits" → Map |
| QR code is for a different park | Show error: "This exhibit isn't part of Experium Park" + CTA: "Go to Home" |
| Audio fails to load | Show retry button in S3. After 2 retries: "Audio unavailable. Read about this exhibit instead." → expand Learn More |
| User scans same exhibit twice | Show S2 (Active) normally. Pin already green. Toast: "Already discovered! Listen again?" |
| User is offline (first visit) | Loading screen fails. Show: "Connect to the internet to start your audio tour." |
| User is offline (return visit) | Fully functional — all assets cached by service worker from first load |
| GPS permission denied | Map works without GPS dot. No nearby highlights. Show subtle banner: "Enable location to see exhibits near you" |
| GPS accuracy poor (>30m) | Blue circle renders large (reflects real accuracy radius). Nearby highlights use wider tolerance |
| Camera permission denied | Show: "Camera access needed to scan exhibits" + system settings link |
| Mid-audio phone lock/call | Audio pauses. On return, resume from where paused |

---

## Data Requirements

| Screen | Data Needed |
|--------|-------------|
| Map (S1) | All exhibit coordinates, visited/unvisited state, pin metadata, category (A/B/C), user GPS position |
| Sheet Compact (S2) | Exhibit: name, type, photo_url, scientific_name (if plant), wayfinding_hint |
| Full-screen Audio (S3) | Exhibit: all S2 data + audio_url (per language), description (Learn More text), ad_config |
| Post-audio (S4) | User progress: total_discovered, next_milestone, is_milestone_reached |
| Celebration (S5) | Milestone: number, badge_icon, has_discovery_card |

---

## Design Tokens (from wireframe)

| Token | Value | Usage | Semantic Role |
|-------|-------|-------|---------------|
| --forest | #588157 | Visited pins, progress fill, Listen button | "Earned / engage" |
| --forest-shadow | #3f6b3a | 3D button shadow (primary) | Depth on green CTAs |
| --orange | #dda15e | Unvisited pins, Scan button, rewards, next milestone | "Beckoning / discover" |
| --orange-shadow | #b8834a | 3D button shadow (orange) | Depth on orange CTAs |
| --sage | #a3b18a | Secondary borders, upcoming trail, muted elements | "Quiet / support" |
| --ink | #2b2b2b | Primary text | — |
| --paper | #ffffff | Card/sheet backgrounds | — |
| --bg | #f8f7f4 | Page background | — |
| --muted | #8a8a8a | Secondary text, hints | — |
| --border | #e8e5df | Borders, dividers | — |

---

## Open Decisions (to resolve before hifi)

1. ~~Language selection~~ — **RESOLVED**: set at onboarding (map load screen), override via toggle in bottom sheet (becomes new default for subsequent exhibits)
2. Does "Navigate" in Preview sheet open Google Maps, show in-app path, or just text hint? (Pending: test if Google Maps works for in-park navigation)
3. Discovery Card flow details (separate flow doc)
4. ~~Exact milestone numbers~~ — **RESOLVED**: frequent milestones (1, 3, 5, 10, 15, 20, 30, 40, 50)
