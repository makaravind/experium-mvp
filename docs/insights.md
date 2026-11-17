# Insights page

Hidden usage page for the owner (and park staff later). Works in production, on a phone, against live data. GitHub [#130](https://github.com/makaravind/experium-ai-tour-app/issues/130), milestone m7-launch-ready. Design record: `docs/specs/gh-130-insights-page.md`. Architecture summary: `docs/tech-architecture.md § Insights`.

## How to unlock

1. Open the app, tap **More** 8 times, each tap less than 4 s after the last. A longer gap resets the count.
2. An **Insights** row now appears in the 3-dot menu, above "About us". It opens `/insights`.

There is no key or dialog. The unlock is `insightsUnlocked` in the device's persisted store (`localStorage`). Visitors without it never see the row, and `/insights` redirects them to `/map`.

## Access

- **No authentication.** `GET /api/insights` is public: anyone who calls it directly gets the usage aggregates. The gesture only hides the UI. The data is aggregate counts, no personal data.
- Real access control waits for m8-user-auth.
- History: it used to need a shared `INSIGHTS_KEY` (`x-insights-key` header). Removed; `INSIGHTS_KEY` can be deleted from Vercel. Devices that held a key migrate to unlocked (store v10).

## What the page shows

Range toggle: **Today** (since IST midnight, `Asia/Kolkata`) / **7d** (now − 7 days) / **All**. Default Today, not persisted.

| Tile / section | Meaning |
|---|---|
| Scans | New user / QR code / scan-source combinations first seen in the range |
| Visitors | Distinct users with a scan or a playback first seen in the range |
| Minutes (at least) | Sum of each playback's longest single listen, in minutes |
| Listen rate | Share of playbacks marked `listened` |
| Top exhibits | 5 most-played exhibits: display ID, name, plays |
| Plays by language | en / hi / te playback counts |

Offline shows "Connect to the internet to view insights" and makes no request. With no data it shows zeros and "No plays yet".

## Read the numbers as approximate

There is no event log. The page reads the existing tables:

- `scans` holds one row per `(user_id, qr_code_id, scan_src)`. `scanned_at` is set at first insert, so repeat scans are not dated and not counted again.
- `playbacks` holds one row per `(user_id, exhibit_id, language)`. `played_at` is the first play, and `listen_duration_sec` keeps the longest single listen, not a total.

So "Minutes" is a lower bound, "plays" counts user/exhibit/language combinations rather than every replay, and a replay on a later day does not show up in "Today". If this proves too coarse, add append-only `scan_events` / `playback_events` tables (exact, chartable by hour, counts only from deploy onward).

## Where the code lives

| Piece | File (in `experium-ai-tour-app/`) |
|---|---|
| Aggregation RPC `insights_summary(p_since)` (service_role only) | `supabase/migrations/20261111000200_insights_summary.sql` |
| API route (no auth) | `app/api/insights/route.ts` |
| IST range helper | `lib/insights.ts` |
| Unlock gesture | `components/exhibit/TabBar.tsx` |
| Menu row | `components/more/UserMenu.tsx` |
| Page | `app/insights/page.tsx` |
| Store field | `lib/store.ts` (`insightsUnlocked`, persisted) |
| Precache exclude | `next.config.ts` (`admin\|insights` chunks stay out of the service-worker cache) |

## Known limits

- `/api/insights` is unauthenticated and has no rate limit. Accepted for a v1 internal tool with aggregate-only data.
- `/insights` is not precached, so opening it from the menu while offline may not load the page at all.
- Per-hour charts, ad CTR, reports, and device / scan-source breakdowns are out of scope.
- No automated tests by decision. Verified manually: the RPC against raw SQL on `scans` / `playbacks`, the API status codes, and the unlock flow.
