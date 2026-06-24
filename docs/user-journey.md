# User Journey

## First-Time Visitor

```
[Walking in park] → Sees QR marker near an exhibit
        ↓
[Scans QR with phone camera]
        ↓
[Browser opens: domain.com/s/A7X3]
        ↓
[Page loads — ~1 second]
  ┌─────────────────────────┐
  │ [Splash Ad - 2-3 sec]   │
  │ Sponsor banner           │
  └─────────────────────────┘
        ↓
  ┌─────────────────────────┐
  │ [Language: EN ▼]        │
  │                         │
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
  │ [🎮 Explore More!]      │
  │ "Discover 10 exhibits,  │
  │  share your discovery   │
  │  card!"                 │
  │                         │
  │ [⚠ Report Issue]       │
  └─────────────────────────┘
        ↓
[User walks to next exhibit / closes tab]
```

## Second/Third Scan (Anonymous)

Same as above, but after audio:
```
  ┌─────────────────────────┐
  │ "You've discovered 2    │
  │  exhibits! 8 more to    │
  │  unlock your card."     │
  │                         │
  │ [Save progress →]       │
  │ "Enter phone number"    │
  └─────────────────────────┘
```

Progress tracked in browser local storage until they opt in.

## Returning User (Logged In via OTP)

- Language preference remembered
- Progress persistent across devices
- Sees: "Welcome back! 7/10 exhibits discovered"
- After completing target: shareable Instagram-style card generated

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
