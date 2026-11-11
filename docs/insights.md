# Insights page

Hidden, key-gated usage page for the owner (and park staff later). Works in production, on a phone, against live data. GitHub [#130](https://github.com/makaravind/experium-ai-tour-app/issues/130), milestone m7-launch-ready. Design record: `docs/specs/gh-130-insights-page.md`. Architecture summary: `docs/tech-architecture.md § Insights`.

## How to unlock

1. Open the app, tap **More** 8 times, each tap less than 4 s after the last. A longer gap resets the count.
2. The menu closes and an "Enter insights key" dialog opens.
3. Enter the key and tap **Unlock**. A wrong key shows "Invalid key" and stores nothing.
4. An **Insights** row now appears in the 3-dot menu, above "About us". It opens `/insights`.

The key is saved in the device's persisted store (`insightsKey` in `localStorage`). Visitors without it never see the row, and `/insights` redirects them to `/map`.

## The key

- Env var `INSIGHTS_KEY` (server-only, see `.env.example`). Set it in Vercel before launch.
- `GET /api/insights` reads it from the `x-insights-key` header and compares in constant time. Missing, wrong or unset → bare 401.
- **Rotate:** change the env var and redeploy. Devices holding the old key get a 401 on their next load, which clears the key and sends them to `/map`. They re-unlock with the new key.
- One shared key, no per-person access. Per-person keys wait for m8-user-auth.

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
| API route | `app/api/insights/route.ts` |
| IST range helper | `lib/insights.ts` |
| Unlock gesture | `components/exhibit/TabBar.tsx` |
| Key dialog | `components/more/InsightsKeyDialog.tsx` |
| Menu row | `components/more/UserMenu.tsx` |
| Page | `app/insights/page.tsx` |
| Store field | `lib/store.ts` (`insightsKey`, persisted; `insightsKeyDialogOpen`, not persisted) |
| Precache exclude | `next.config.ts` (`admin\|insights` chunks stay out of the service-worker cache) |

## Known limits

- The key sits in `localStorage` on each unlocked device. Accepted for a v1 internal tool.
- No rate limit on the key check.
- `/insights` is not precached, so opening it from the menu while offline may not load the page at all.
- Per-hour charts, ad CTR, reports, and device / scan-source breakdowns are out of scope.
- No automated tests by decision. Verified manually: the RPC against raw SQL on `scans` / `playbacks`, the API status codes, and the unlock flow.
