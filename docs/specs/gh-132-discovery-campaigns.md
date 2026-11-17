# Discovery Rules & Campaigns

**GitHub**: [#132](https://github.com/makaravind/experium-ai-tour-app/issues/132)
**Milestone**: m4-gamification — Trail progress, milestones, discovery cards
**Status**: SPEC (grilled 2026-11-10, simplified 2026-11-14, not started)

Paths are relative to `experium-ai-tour-app/` unless they start with `docs/`.

---

## Context

An exhibit counts as discovered only when the visitor lands on `/s/<code>?scansrc=onsite` (the physical plate). That was a deliberate anti-fraud rule (#31). Finishing the audio never counts, and a visitor who plays an exhibit from the map without scanning gets nothing, even standing next to it.

The trail itself is hard-wired: `TRAIL_MILESTONES` in `lib/trail.ts`, a scalar `totalDiscovered` in the store, and `?reveal=<N>` keyed by the milestone number.

This story adds two more ways to discover an exhibit, and keys discoveries by campaign so later versions can add separate campaigns without a schema or store rework.

Discovery triggers after this story (all on the `default` campaign):
1. **Onsite scan**: land on `/s/<code>?scansrc=onsite` (unchanged).
2. **Audio complete**: the audio plays to 100%, anywhere (a visitor at home can discover by listening).
3. **Listened near**: ≥ 50% of the audio while within 50m of the exhibit, with a GPS fix accuracy ≤ 40m.

Later, not now: campaigns visitors sign up for, per-campaign exhibit sets and rules, richer badge criteria ("5 gold exhibits"), an `awards` table, campaigns stored in the DB.

---

## Architecture Decisions

### Discovery rules are one function; milestones are derived

**Decision**: `lib/discovery.ts` exports `discoverVia(ctx): DiscoveryVia | null`, a plain function over one event, first match wins:

```ts
type DiscoveryVia = 'onsite_scan' | 'audio_complete' | 'audio_half_near'

type Ctx = {
  scanSrc: string | null            // only set for QR scans; map plays pass null
  quartile: number | null
  position: { lat: number; lng: number; accuracyM: number } | null
  exhibit: { lat: number | null; lng: number | null }
}
```

1. `scanSrc === 'onsite'` → `onsite_scan`
2. `quartile >= 100` → `audio_complete`
3. `quartile >= 50` and a position with `accuracyM <= MAX_ACCURACY_M` (40) and the exhibit has GPS and `haversineMetres(position, exhibit) <= 50` → `audio_half_near`

The returned id is stored as `discoveries.via`. Accuracy and distance only gate rule 3; triggers 1 and 2 ignore position. `haversineMetres` comes from `lib/nearby.ts`. The 40m ceiling is stricter than `nearestWithin`'s 60m (map highlights) because this grants credit.

A milestone is not stored: a badge is earned when the campaign's discovered count reaches its threshold, as today.

**Why**: Three rules do not need a predicate registry or typed rule objects. If rules later become data (a DB column, per-campaign rules), `discoverVia` is rewritten then.

**Consequences**: All campaigns share the same three rules for now. A campaign with its own rules is a later change.

### Campaigns: keyed by id, milestones in code

**Decision**: `lib/campaigns.ts` exports `CAMPAIGNS: Campaign[]` with one entry:

```ts
type Campaign = { id: string; milestones: number[] }

export const CAMPAIGNS: Campaign[] = [
  { id: 'default', milestones: [1, 3, 5, 10, 15, 20, 30, 40, 50] },
]
```

`campaign_id` is a plain `TEXT` slug in the DB (no `campaigns` table). Badge ids are `<campaign>-<n>`.

**Why**: Keying the store and table by campaign now is cheap. Migrating a persisted store with live data later is not.

### Evaluated on both client and server

**Decision**: The client and `api/scan/route.ts` import the same `discoverVia`. The client evaluates at page land and on each quartile so the toast, milestone reveal and `+1` work offline. The server re-evaluates every queued POST from the same inputs and is authoritative.

**Why**: Server-only evaluation would undo the local-first discovery from #67 (park has dead zones). The server cannot trust a client flag, so it recomputes from `scan_src`, `listen_quartile`, the position and the exhibit's own GPS from `exhibits.gps_lat/lng`.

**Consequences**: A stale-rules device may count something locally that the server does not confirm. The server total replaces the local value when the queue drains (existing #67 behavior).

### Discovery storage: `discoveries`, not `scans`

**Decision**: One new table. `scans` keeps meaning "a visitor scanned a physical marker" (marker-lifecycle ops, partnership numbers). `playbacks` is unchanged. `discoveries` is the fact table behind the trail count.

```sql
CREATE TABLE discoveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exhibit_id    UUID NOT NULL REFERENCES exhibits(id) ON DELETE CASCADE,
  campaign_id   TEXT NOT NULL,                       -- 'default'
  via           TEXT NOT NULL,                       -- DiscoveryVia
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),  -- device scanned_at, capped at now()
  UNIQUE (user_id, exhibit_id, campaign_id)
);
CREATE INDEX discoveries_user_campaign ON discoveries (user_id, campaign_id);
```

RLS is enabled with no anon policies (service-role writes only, like `playbacks`). `ON DELETE CASCADE`, not `SET NULL`: these are the visitor's own state, not analytics.

Functions:
- `record_discovery(p_user_id, p_exhibit_id, p_campaign_id, p_via, p_at) RETURNS boolean`: `INSERT … ON CONFLICT DO NOTHING`, true only when the row is new. `p_at` is capped with `LEAST(…, now())` as in `upsert_scan`.
- `total_discovered(p_user_id, p_campaign_id TEXT DEFAULT 'default')`: `COUNT(*)` from `discoveries`. The old 1-arg function is dropped first (an overload would be ambiguous for PostgREST).

**Why not a synthetic `scans` row** for audio discoveries: it inflates the physical-scan counts. **Why not a `discovered` flag on `playbacks`**: its unique key is per language, so counts would need a distinct-by-exhibit workaround.

**Consequences**:
- The count is by `exhibit_id`, previously by distinct `qr_code_id`. They only differ if an exhibit has two plates.
- `scans.discovered` and `upsert_scan`'s `p_discovered` stay as they are (legacy analytics). Not removed in this story.

### No awards table, no backfill

**Decision**: No `awards` table. Milestones are computed from the discovered count (`getCrossedMilestone`, now per campaign). No backfill: production has 3 `scans` rows (dev data), so `discoveries` starts empty and nothing is truncated.

**Why**: Nothing reads a server award list (no auth, one device per visitor). `discoveries.discovered_at` lets a later `awards` migration rebuild count milestones exactly (`awarded_at` = the Nth discovery's time).

**Add `awards` when**: a badge carries real-world value, thresholds must be editable without changing who already earned a badge, or auth and cross-device sync arrive (m8). Until then, treat thresholds as frozen once there are real users.

### POST body: position only where needed

**Decision**: Progress POSTs at `listen_quartile ≥ 50` carry optional `lat`, `lng`, `accuracyM` from `useMapStore.userPosition` when a fix exists. Other POSTs carry none.

**Why**: Only POSTs at quartile ≥ 50 can match `audio_half_near`; sending less location data is better for privacy.

### Map-sheet plays are reported too

**Decision**: First-play and quartile reporting is wired for any exhibit played from the preview sheet, not only the current `/s/<code>` page (today `sheetOnFirstPlay` / `sheetOnQuartile` are set only when `isShowingCurrentExhibit`, `app/(map)/layout.tsx:128-130`). Reporting moves into one shared function used by both. Map plays omit `scan_src`.

**Why**: Without it, trigger 3 almost never fires (a visitor near an unscanned exhibit plays it from the map pin), and trigger 2 would cover only exhibits reached by link.

**Consequences**: Map-sheet plays now create `playbacks` rows and analytics events.

### When the visitor sees the reward

**Decision**: Unchanged: the toast and the milestone redirect are deferred until the audio ends, via `pendingDiscovery` read in `handleAudioEnded`, so a milestone redirect to `/collection` never cuts the narration.
- Trigger 1: set at page land.
- Trigger 3: set when the 50% quartile fires.
- Trigger 2: fires at the end, so it shows immediately.
- A visitor who leaves after 50% and before the end gets a silent count increment, with no toast.

### Store keyed by campaign; UI unchanged via an adapter

**Decision**: Persisted store, one version bump:
- `discoveredByCampaign: Record<string, { codes: string[]; total: number }>` replaces `discoveredCodes` / `totalDiscovered`.
- A selector keeps `totalDiscovered` for `default`, so `TrailCard` and `/collection` change only their selector.
- `TRAIL_MILESTONES` becomes derived from `CAMPAIGNS` (the `default` campaign's milestones); `trail.ts` keeps its exports.
- `?reveal=N` stays keyed by the milestone number. The redirect uses `getCrossedMilestone(prev, new)` as today.
- The migration moves `discoveredCodes` / `totalDiscovered` into `default`. Devices are dev-only, so resetting instead of migrating is acceptable.

**Why**: Zero visual change keeps this a backend-focused story.

---

## End-to-end flow (worked example)

Asha has 4 `default` discoveries. She's offline, 31m from the Banyan Tree (never scanned), and taps Listen on its map pin.

| Event | Device | Queue |
|---|---|---|
| Tap Listen | first-play reported; no match | E1 `{listened:true}` |
| 25% | no match (25 < 50) | E2 `{quartile:25}` |
| **50%** | `discoverVia` → `audio_half_near` (accuracy 18 ≤ 40, 31 ≤ 50m). codes 4 → 5, total 5; milestone 5 crossed; `pendingDiscovery` set | E3 `{quartile:50, lat, lng, accuracyM:18}` |
| 75% | already discovered, no re-eval | E4 |
| 100% (ended) | `handleAudioEnded` → `/collection?reveal=5` | E5 |

On reconnect `flushScanQueue` sends E1–E5 in order. The server for E3 loads the exhibit GPS, recomputes `discoverVia`, and calls `record_discovery` (new). E4 and E5 find the discovery existing. The last response returns `{ total_discovered: 5 }`, which equals the local value.

Final DB: `discoveries` +1 (`via='audio_half_near'`), `playbacks` quartile 100, `scans` unchanged.

---

## Implementation Plan

Three slices, three PRs, in order. Slice 1 ships alone with no visitor impact.

### Slice 1: Server foundation (#133)

1. Migration `supabase/migrations/<ts>_discoveries.sql`: table, RLS, `record_discovery`, drop + recreate `total_discovered(user, campaign)`. No backfill.
2. `lib/campaigns.ts`: `Campaign` type and `CAMPAIGNS` (default).
3. `lib/discovery.ts`: `discoverVia`, `MAX_ACCURACY_M = 40`.
4. `app/api/scan/route.ts`: read `lat`, `lng`, `accuracyM`; select `gps_lat, gps_lng` with the exhibit; for each campaign run `discoverVia` → `record_discovery`; response stays `{ total_discovered }` via `total_discovered(user, 'default')`. The `scans` / `upsert_scan` path is untouched.
5. Tests (below).

### Slice 2: Client model (#134)

1. `lib/store.ts`: `discoveredByCampaign`, selector for `default`, version bump; `discoverCode` becomes a local evaluation that calls `discoverVia` and returns `{ prevTotal, newTotal }`.
2. `components/ExhibitPageClient.tsx`: the `scanSrc === 'onsite'` branch calls the evaluator.
3. `lib/trail.ts`: derive `TRAIL_MILESTONES` from `CAMPAIGNS`; `TrailCard`, `app/collection/page.tsx`: selector swap only.
4. `lib/scan-queue.ts`: the drain writes the `default` total.

### Slice 3: New triggers live (#135)

1. Extract first-play/quartile reporting from `ExhibitPageClient` into a shared function; wire it for any exhibit in the sheet (`layout.tsx:128-130`).
2. Attach `lat`, `lng`, `accuracyM` on progress POSTs at quartile ≥ 50.
3. Run the local evaluation on each quartile; skip it when the exhibit's code is already in `discoveredByCampaign.default.codes`.
4. `pendingDiscovery` set at the 50% quartile for trigger 3.

### Docs, in the same PRs
- `docs/decisions.md`: add "Discovery rules and campaigns"; amend "Offline scans".
- `docs/tech-architecture.md`: new table, POST fields.
- `docs/user-flows/flow-6-gamification-trail.md`: the three triggers.
- `.claude/current-milestone.md`: update when slices land.

---

## Task Graph

```
S1: migration ───┐
    campaigns.ts ┼─► route.ts ─► tests ─► [apply migration, deploy]
    discovery.ts ┘
                                   │
S2: store (rekey) ─► evaluator in ExhibitPageClient ─► trail adapter
                                   │
S3: shared reporting fn ─► map-sheet wiring ─► position on POST ─► local eval per quartile ─► e2e
```

S2 depends on `lib/campaigns.ts` / `lib/discovery.ts` from S1. S3 depends on S1 (server evaluates) and S2 (client evaluates).

---

## Code References

- `components/ExhibitPageClient.tsx` — page-land discovery (`scanSrc === 'onsite'`), `handleFirstPlay`, `handleQuartile`
- `app/(map)/layout.tsx:128-160` — sheet callbacks (`isShowingCurrentExhibit`), `handleAudioEnded`
- `components/exhibit/PreviewSheet.tsx:297` — quartile firing (25/50/75/100)
- `lib/store.ts` — `discoverCode`, `discoveredCodes`, `totalDiscovered`, `scanQueue`
- `lib/scan-queue.ts` — queue flush, `setTotalDiscovered`
- `lib/map-store.ts` — `pendingDiscovery`, `userPosition`
- `lib/nearby.ts` — `haversineMetres`, `nearestWithin` (60m accuracy for highlights)
- `lib/trail.ts` — `TRAIL_MILESTONES`, `getCrossedMilestone`, `getCurrentSegment`
- `app/api/scan/route.ts` — `upsert_playback`, `upsert_scan`, `total_discovered`
- `components/exhibit/TrailCard.tsx`, `app/collection/page.tsx` — read `totalDiscovered` / `TRAIL_MILESTONES`
- `supabase/migrations/20260811100000_move_gps_to_exhibits.sql` — `exhibits.gps_lat/gps_lng` (nullable)
- `supabase/migrations/20260919000000_scan_src_per_row_history.sql` — current `total_discovered`
- `docs/specs/gh-67-offline-scan-queue.md`, `docs/specs/scans-playbacks-split.md` — queue and table-split context

---

## Acceptance Criteria (Technical)

- [ ] Migration applies cleanly; `discoveries` has RLS on and no anon policy
- [ ] `total_discovered(user)` (1-arg) still works and returns the `default` count
- [ ] Onsite scan online and offline: count and toast unchanged from today; `discoveries` row with `via='onsite_scan'`
- [ ] Audio played to the end from the map sheet of an unscanned exhibit, far away: discovered, `via='audio_complete'`
- [ ] 50% within 50m with accuracy ≤ 40m: discovered at the 50% moment, `via='audio_half_near'`; celebration at audio end, not before
- [ ] 50% at 51m, or with accuracy 41m, or with no fix, or on an exhibit with null GPS: not discovered
- [ ] Replaying the same queued entries twice adds one `discoveries` row
- [ ] Server decides from its own exhibit GPS; a forged client position far from the exhibit does not discover
- [ ] The preview sheet reports first-play and quartiles for exhibits other than the current page; the `playbacks` row is created
- [ ] Position is sent only on progress POSTs at quartile ≥ 50
- [ ] Trail bar, `/collection`, and `?reveal=N` behave exactly as before for the default campaign
- [ ] `scans` row counts do not change for audio-only discoveries
- [ ] Lint, typecheck, vitest and e2e pass

---

## Testing

- **Unit (`lib/discovery.ts`)**: each rule's edge cases (quartile boundaries 49/50/99/100, distance 49/50/51m, accuracy 40/41m, null position, null exhibit GPS); first-match ordering.
- **Route test** (Supabase mocked): each trigger writes the expected `record_discovery` call; unknown exhibit still 404; `scans` path untouched for a non-QR play; forged far position does not discover.
- **Store**: migration from the old `discoveredCodes` / `totalDiscovered` shape; selector for `default`; `discoverCode` ignores duplicates.
- **Existing tests updated**: `__tests__/trail.test.ts`, `__tests__/collection-grid.test.tsx`.
- **E2E** (`page.route` mocks, mocked geolocation): onsite scan offline then reconnect; 50% near discovers; 50% far does not; 100% far discovers; map-sheet play for a non-current exhibit sends progress POSTs.
- **Manual on a local prod build** (see the local-test-before-push workflow): a real near/far listen on a phone at the park; check the SQL rows after the queue drains.

---

## Out of Scope

- Campaign sign-up / enrollment, `campaign_exhibits`, the campaign picker UI
- Campaigns or rules stored in the DB; per-campaign rules; date windows (`startsAt` / `endsAt`)
- `awards` table; exhibit filters on milestones ("5 gold exhibits"); history-based criteria
- Cross-device award sync (needs auth, m8)
- Backfilling `discoveries` from `scans.discovered`
- Removing `scans.discovered` or `upsert_scan`'s `p_discovered`
- Tuning the 40m / 50m values (check `via` counts after launch)

---

## Open Questions

1. `scan_src` for map plays: omit (planned), `app` or `map`? Existing `app` is used for the no-audio Listen redirect.
2. Does `MAX_ACCURACY_M` apply to trigger 1 and 2 events? Planned: no.
3. Remove the legacy `p_discovered` write to `scans.discovered` later, or keep for analytics?
4. Real exhibits missing GPS: none today (0 of 68), but new ones can be added without it; they only discover via triggers 1 and 2.
