# User Journey

## First-Time Visitor

```
[Walking in park] → Sees QR marker near an exhibit
        ↓
[Scans QR with phone camera]
        ↓
[Browser opens: domain.com/s/A7X3]
        ↓
[Loading Screen — downloads all assets]
  ┌─────────────────────────┐
  │                         │
  │  [Park illustration/    │
  │   logo animation]       │
  │                         │
  │  "Preparing your        │
  │   audio tour..."        │
  │                         │
  │  ━━━━━━━━━━━░░░ 72%    │
  │                         │
  │  Language: [EN] [HI] [TE]│
  │                         │
  └─────────────────────────┘
        ↓
[Assets cached — map + metadata + audio for selected language (~25MB)]
        ↓
[Optional Info Modal]
  ┌─────────────────────────┐
  │                         │
  │  "Personalize your      │
  │   experience"           │
  │                         │
  │  Name     [          ]  │
  │  Phone    [          ]  │
  │  Email    [          ]  │
  │                         │
  │  [Continue →]           │
  │                         │
  │       Skip for now      │
  └─────────────────────────┘
        ↓
[App ready — fully offline from here]
        ↓
  ┌─────────────────────────┐
  │ [Exhibit Photo]         │
  │ "Neem Tree"             │
  │                         │
  │ [▶ Listen]              │
  │                         │
  │ [Banner Ad]             │
  └─────────────────────────┘
        ↓
[Taps "Listen"]
        ↓
[Audio plays — 60-90 seconds]
[User observes the exhibit while listening]
        ↓
[Audio ends]
  ┌─────────────────────────┐
  │ [Post-Audio Ad]         │
  │                         │
  │ "Learn More" (optional  │
  │  text details expand)   │
  │                         │
  │ KEEP EXPLORING          │
  │                         │
  │ 🌿 Your Trail           │
  │ ●─────●─────○─────○────│
  │ 5    7↑    10     20   │
  │      you                │
  │ "3 more to next unlock!"│
  │                         │
  │ ┌───────────────────┐   │
  │ │  [📷]             │   │
  │ │  Scan Now         │   │
  │ │  Scan what's near │   │
  │ │  you              │   │
  │ └───────────────────┘   │
  │                         │
  │ [▼ Explore the Park]    │
  │  (collapsible map)      │
  │                         │
  │ [⚠ Report Issue]       │
  └─────────────────────────┘
        ↓
[User scans next nearby exhibit / taps "Explore" to see map]
```

## Second/Third Scan

Same as above (no loading screen — assets already cached offline). After audio, same "Keep Exploring" screen with horizontal trail updated:
```
  ┌─────────────────────────┐
  │ KEEP EXPLORING          │
  │                         │
  │ 🌿 Your Trail           │
  │ ●─────●↑────○─────○────│
  │ 0    2you   5     10   │
  │ "3 more to next unlock!"│
  │                         │
  │ ┌───────────────────┐   │
  │ │  [📷] Scan Now    │   │
  │ └───────────────────┘   │
  │                         │
  │ [▼ Explore the Park]    │
  │                         │
  └─────────────────────────┘
```

Progress tracked in browser local storage. Synced to server when online (if user provided info on first load).

## Milestone Unlock (at 5, 10, 20, 35, 50)

Full-screen celebration takeover:
```
  ┌─────────────────────────┐
  │                         │
  │    🎉 ✨ 🎊             │
  │                         │
  │    [Badge Animation]    │
  │    🌿 Explorer 🌿       │
  │                         │
  │  "10 Exhibits           │
  │   Discovered!"          │
  │                         │
  │  [at 10 & 50 only:]    │
  │  "Your Discovery Card   │
  │   is ready!"            │
  │  [View Card →]          │
  │                         │
  │       [Tap to continue] │
  └─────────────────────────┘
```

## Explore the Park (Collapsible Map)

When user taps "Explore the Park" below Scan Now:
```
  ┌─────────────────────────┐
  │ [▲ Explore the Park]    │
  │                         │
  │ ┌───────────────────┐   │
  │ │  [Illustrated     │   │
  │ │   Park Map SVG]   │   │
  │ │                   │   │
  │ │  • Pin 1 (Lake)   │   │
  │ │  • Pin 2 (Rare    │   │
  │ │    Garden)        │   │
  │ │  • Pin 3 ...      │   │
  │ │  (5 unvisited     │   │
  │ │   curated pins)   │   │
  │ └───────────────────┘   │
  │                         │
  │ [Pin tapped:]           │
  │ ┌───────────────────┐   │
  │ │ 📷 Baobab Tree    │   │
  │ │ "Near the lake    │   │
  │ │  entrance, ~5 min │   │
  │ │  walk"            │   │
  │ │ [Navigate →]      │   │
  │ └───────────────────┘   │
  └─────────────────────────┘
```

5 curated unvisited exhibits shown. As exhibits are visited, next unvisited ones rotate in.

## Returning User

- Language preference remembered (localStorage)
- Progress persisted locally; synced to server if user provided info
- Sees: "Welcome back! 7/10 exhibits discovered"
- After completing target: shareable Instagram-style card generated
- No loading screen on return (assets already cached by service worker)

## Maintainer Flow

```
[Maintainer scans QR code]
        ↓
[System detects admin role — shows maintenance view]
  ┌─────────────────────────┐
  │ Code: A7X3              │
  │ Mapped to: Neem Tree    │
  │ Installed: 2026-03-15   │
  │ Last checked: 2026-05-01│
  │                         │
  │ ☐ Marker visible?       │
  │ ☐ QR scannable?         │
  │ ☐ Correct exhibit?      │
  │ ☐ Marker undamaged?     │
  │                         │
  │ [📷 Take Photo]         │
  │ [Submit Report]         │
  └─────────────────────────┘
```

## User Report Flow

```
[Visitor taps "Report Issue"]
  ┌─────────────────────────┐
  │ What's wrong?           │
  │ ○ Wrong info            │
  │ ○ Marker damaged        │
  │ ○ Audio not playing     │
  │ ○ Other                 │
  │                         │
  │ [Optional: add photo]   │
  │ [Submit]                │
  └─────────────────────────┘
        ↓
[Report created in DB → status: needs_attention]
[Admin notified]
```
