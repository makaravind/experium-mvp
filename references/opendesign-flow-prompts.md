# Open Design Prompts — User Flow Screens

Prompts to generate visual user flow screens in Open Design. Each includes full design system tokens.

---

## Flow 1: QR Scan → Exhibit Audio

```
Design a mobile user flow for a nature park audio tour app. Show these 7 screens in sequence with transition arrows:

**Screen 1 — Loading Screen (first visit only):**
Full-screen warm white bg (#f8f7f4). Centered park illustration/logo at top (placeholder). Below: "Preparing your audio tour..." DIN Round Pro 15px muted. Horizontal progress bar (12px height, 12px radius, sage track, green fill animating). Below progress bar: "72%" DIN Round Pro 13px muted. Bottom section: language picker — 3 large tap targets: [EN] [HI] [TE], active = green fill + white text, inactive = sage border + ink text. No tab bar on this screen.

**Screen 2 — Info Capture Modal:**
Same warm white bg. Centered card (white, 16px radius, padding 24px, subtle shadow). Title "Personalize your experience" Feather Bold 17px ink. 3 input fields stacked (12px radius, border color, 48px height): Name (placeholder "Your name"), Phone (placeholder "Phone number"), Email (placeholder "Email address"). Green 3D "Continue →" button full-width below inputs. Below button: "Skip for now" text link, DIN Round Pro 14px muted, centered. No tab bar.

**Screen 3 — Map (base layer):**
Three.js illustrated park map, hand-drawn children's book style. Orange pins (unvisited) and green pins (visited). Blue translucent accuracy circle (GPS position) with subtle pulse. Nearby unvisited pins (within radius) pulse gently and render 1.3× larger than distant pins. Category A pins always 1.3× standard size. Floating pill tab bar at bottom with 3 tabs: Home | Scan (elevated orange circle, raised -24px) | Map (active, green). Tab bar has 28px border-radius, subtle shadow.

**Screen 4 — Bottom Sheet (compact, Active state):**
Map visible behind (no dimming). White sheet slides up from bottom. Grab handle pill (36×4px). Contains: 56px square exhibit photo (10px radius), exhibit name in Feather Bold 17px, scientific name italic muted, type badge pill (icon + neutral bg), "Featured" star label for Category A exhibits (small, gold/orange), language toggle chips (EN active = green fill + white text, HI/TE inactive = sage border + ink text), full-width green 3D Listen button (box-shadow 0 4px 0 #3f6b3a), report icon top-right. Pin-style sponsor popup near the exhibit pin on map.

**Screen 5 — Full-Screen Audio Player:**
Sheet expanded full-screen. 10-15% black scrim over map. Close button (circular 32px, bg fill, X icon) top-right. Hero image 16:9 rounded 16px with swipeable gallery. Gallery dots: active = elongated pill 16×6px green, inactive = 6px circle. Exhibit name Feather Bold 22px. Circular progress ring (5px stroke, border color track, green fill) around 64px 3D play/pause button. Time "0:34 / 1:12" below. "Learn More ▾" chevron text link muted. Banner ad docked bottom with 1px border-top separator only (no card).

**Screen 6 — Post-Audio (map with toast):**
Map visible, pin now green. Toast slides from top: green pill with white text "+1 🌿 · 5/50 discovered". 3s display. Nearby unvisited pins still pulsing on map.

**Screen 7 — Milestone Celebration:**
Full-screen overlay. Gradient green bg (#588157 → #3f6b3a). Rainbow confetti. Badge centered. "MILESTONE REACHED" micro uppercase white. "Explorer — 10 Discovered!" Feather Bold 22px white. Orange 3D "Keep Exploring →" button.

**Design system:** Colors — forest green #588157, orange #dda15e, sage #a3b18a, ink #2b2b2b, bg #f8f7f4, border #e8e5df. Fonts — Feather Bold for headlines, DIN Round Pro for body/UI. Border-radius 12px. 3D buttons use 4px box-shadow. Mobile viewport 390px wide.
```

---

## Flow 5: Home Screen

```
Design a mobile home screen for a nature park audio tour app. Show 2 variants side by side:

**Variant A — Fresh User (0 exhibits):**
Warm white bg (#f8f7f4). Top section: empty horizontal trail bar with hollow sage nodes. Motivational text "Start your trail! Discover 50 exhibits to earn all badges" in DIN Round Pro 15px. Below: "1 exhibit to your first milestone!" muted text. Center: large orange 3D "Scan Now" button (box-shadow 0 4px 0 #b8834a, 12px radius, uppercase DIN Round Pro 700). Below: "Explore the Park →" secondary flat button (white bg, sage border). Bottom: banner ad with 1px border-top separator. Fixed floating pill tab bar: Home (active green) | Scan (elevated orange circle) | Map.

**Variant B — Returning User (7 exhibits):**
Same layout but trail bar shows progress: filled green nodes for milestones achieved (1, 3, 5), current target node (10) in orange with glow ring, upcoming hollow sage. Green progress line between completed nodes. Text: "7/50 discovered · 3 more to next badge!" DIN Round Pro 15px. Same Scan Now button and Explore link below. Banner ad bottom.

**Design system:** Colors — forest green #588157, shadow #3f6b3a, orange #dda15e, shadow #b8834a, sage #a3b18a, ink #2b2b2b, muted #8a8a8a, bg #f8f7f4, border #e8e5df. Fonts — Feather Bold for display, DIN Round Pro for everything else. 3D only on primary CTAs. Mobile 390px wide.
```

---

## Flow 6: Gamification — Progress Trail & Discovery Cards

```
Design a mobile user flow for gamification in a nature park audio tour app. Show 3 screens:

**Screen 1 — Trail Progress Bar (detail):**
Zoomed-in view of horizontal trail progress bar. Shows segment from milestone 5 (filled green circle, tappable) to milestone 10 (orange circle with pulsing glow ring, current target). Milestone 15 ahead (hollow, sage border). Green line fills between completed nodes. Below bar: "7/50 discovered · 3 more to next badge!" DIN Round Pro 15px ink.

**Screen 2 — Milestone Celebration (tapped from trail):**
Full-screen overlay. Gradient green bg (#588157 → #3f6b3a). Rainbow confetti particles. Centered badge (circular, dashed border ring + solid core with icon). "MILESTONE REACHED" micro 11px uppercase white muted. "Explorer — 10 Discovered!" Feather Bold 22px white. "📸 Your Discovery Card is ready!" orange 3D button. Dismiss X top-right.

**Screen 3 — Discovery Card Preview:**
Full-screen centered. Square card (1:1 ratio) with earthy gradient background. Badge image centered. User name displayed below badge (if provided). If no name: "Your Name Here" placeholder text with subtle dashed underline (tap-to-edit affordance). "Experium Park Explorer" text. Milestone count. Below card: green 3D "Download" button.

**Design system:** Colors — forest green #588157, orange #dda15e, sage #a3b18a, ink #2b2b2b, bg #f8f7f4. Fonts — Feather Bold headlines, DIN Round Pro body. 3D buttons = 4px box-shadow. Mobile 390px.
```

---

## Flow 7: Report Issue

```
Design a mobile report issue modal for a nature park audio tour app. Show 2 states:

**State 1 — Modal Open (over bottom sheet):**
Map + bottom sheet visible behind (dimmed). Centered modal card: white bg, 12px radius, padding 24px. Title "Report an issue" Feather Bold 17px. Dropdown select field (12px radius, border color, placeholder "Select issue type"). Options: Wrong information, Damaged marker, Audio not working, Other. Textarea below: placeholder "Tell us more (optional)", 12px radius, border color, 3 rows. Green 3D "Submit" button full-width (disabled state = sage bg, no shadow until dropdown selected). Close X button top-right of modal.

**State 2 — Success Toast:**
Modal dismissed. Map + sheet visible. Green pill toast at top: "Thanks! We'll look into it ✓" white text, slides in from top.

**Design system:** Colors — forest green #588157, shadow #3f6b3a, sage #a3b18a, ink #2b2b2b, muted #8a8a8a, bg #f8f7f4, border #e8e5df, paper #ffffff. Fonts — Feather Bold for title, DIN Round Pro for body/inputs. Border-radius 12px everywhere. Mobile 390px.
```
