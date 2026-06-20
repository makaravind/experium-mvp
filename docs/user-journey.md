# User Journey

## First-Time Visitor

```
[Walking in park] → Sees QR plate near a plant
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
  │ [Plant Photo]           │
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
[User looks at plant while listening]
        ↓
[Audio ends]
  ┌─────────────────────────┐
  │ [Post-Audio Ad]         │
  │                         │
  │ "Learn More" (optional  │
  │  text details expand)   │
  │                         │
  │ [🎮 Play Plant Game!]   │
  │ "Scan 10 plants,        │
  │  share your discovery   │
  │  card!"                 │
  │                         │
  │ [⚠ Report Issue]       │
  └─────────────────────────┘
        ↓
[User walks to next plant / closes tab]
```

## Second/Third Scan (Anonymous)

Same as above, but after audio:
```
  ┌─────────────────────────┐
  │ "You've discovered 2    │
  │  plants! 8 more to      │
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
- Sees: "Welcome back! 7/10 plants discovered"
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
  │ ☐ Plate visible?        │
  │ ☐ QR scannable?         │
  │ ☐ Correct plant nearby? │
  │ ☐ Plate undamaged?      │
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
  │ ○ Wrong plant info      │
  │ ○ Plate damaged         │
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
