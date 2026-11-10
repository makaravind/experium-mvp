# Discovery Rules, Campaigns & Awards

**GitHub**: [#132](https://github.com/makaravind/experium-ai-tour-app/issues/132)
**Milestone**: m4-gamification — Trail progress, milestones, discovery cards
**Status**: SPEC (grilled 2026-11-10, not started)

Paths are relative to `experium-ai-tour-app/` unless they start with `docs/`.

---

## Context

An exhibit counts as discovered only when the visitor lands on `/s/<code>?scansrc=onsite` (the physical plate). That was a deliberate anti-fraud rule (#31). Finishing the audio never counts, and a visitor who plays an exhibit from the map without scanning gets nothing, even standing next to it.

The trail itself is hard-wired: `TRAIL_MILESTONES` in `lib/trail.ts`, a scalar `totalDiscovered` in the store, and `?reveal=<N>` keyed by the milestone number.

This story adds two more ways to discover an exhibit, and sets up the data model so later versions can add more conditions, more badge types and separate campaigns without a schema rework.

Discovery triggers after this story (all on the `default` campaign):
1. **Onsite scan**: land on `/s/<code>?scansrc=onsite` (unchanged).
2. **Audio complete**: the audio plays to 100%, anywhere (a visitor at home can discover by listening).
3. **Listened near**: ≥ 50% of the audio while within 50m of the exhibit, with a GPS fix accuracy ≤ 40m.

Later, not now: campaigns visitors sign up for, per-campaign exhibit sets, richer badge criteria ("5 gold exhibits"), campaigns stored in the DB.

---

## Architecture Decisions

### Two layers: discovery rules, then milestones

**Decision**: Two separate questions.
1. **Discovery rule**: did this one play discover this one exhibit? Pure over one event. A match writes a `discoveries` row.
2. **Milestone**: given this visitor's discoveries in this campaign, has a badge been earned? An aggregate over `discoveries`, checked only when a new discovery lands. A match writes an `awards` row.

**Why**: "Audio 100%" and "5 gold exhibits" are different kinds of condition. One shape for both would force aggregates into a per-event evaluator.

### Rules and milestones live in code

**Decision**: `lib/campaigns.ts` exports `CAMPAIGNS: Campaign[]` with one entry, `default`. Rules and milestones are flat, typed, JSON-serialisable objects, one predicate each:

```ts
rules: [
  { id: 'onsite_scan',     type: 'scan_src',      is: 'onsite' },
  { id: 'audio_complete',  type: 'quartile_gte',  value: 100 },
  { id: 'audio_half_near', type: 'listened_near', pct: 50, radiusM: 50 },
],
milestones: [1, 3, 5, 10, 15, 20, 30, 40, 50].map((n) => (
  { id: `count-${n}`, badgeId: `default-${n}`, type: 'count_discovered', min: n }
)),
```

A rule's `id` is stored as `discoveries.via`. Rules are an ordered OR: the first match wins. `listened_near` bundles "quartile ≥ pct" with the distance and accuracy checks. There is no AND-composition (`all: []`) for now; if combinations like "onsite AND Hindi" become common, add `all` back, existing rules stay valid.

**Why**: Rules will not change often at the start. A DB table (the first design) added a second source of truth, a dataset change and another store bump for no benefit. Keeping the objects serialisable means the later DB move is lifting the objects into a column; `discoveries` and `awards` never depended on a `campaigns` table, so `campaign_id` is a plain `TEXT` slug.

**Alternatives considered**: Plain `test: (ctx) => boolean` functions (shorter, but a later DB move means rewriting every rule). `campaigns` table now (rejected above). `all: []` inside each rule (noise: two of three rules have one predicate).

**Consequences**: A device on an older app bundle evaluates with the older rules. The server is the authority and wins on queue drain.

### Predicate registry and evaluator

**Decision**: `lib/discovery.ts` holds a `PREDICATES` registry (one pure function per `type`), `matchRule(campaign, ctx): string | null` (returns the first matching rule id), and `newMilestones(campaign, discoveredCount, awardedIds): string[]`.

```ts
type Ctx = {
  scanSrc: string | null
  quartile: number | null
  position: { lat: number; lng: number; accuracyM: number } | null
  exhibit: { lat: number | null; lng: number | null }
}
```

`listened_near` is false when there is no position, the accuracy exceeds `MAX_ACCURACY_M` (40), the exhibit has no GPS, or `haversineMetres(position, exhibit) > radiusM`. It reuses `haversineMetres` from `lib/nearby.ts`. The ceiling is stricter than `nearestWithin`'s 60m (map highlights), because this grants credit.

`count_discovered` has no `where` filter yet; the type is a union so a tier/type filter is a one-line addition later.

**Why**: One implementation prevents drift. The registry gets a new condition by adding one function and one union member, and TypeScript then checks every rule that uses it.

### Evaluated on both client and server

**Decision**: The client and `api/scan/route.ts` import the same module. The client evaluates at page land and on each quartile so the toast, milestone reveal and `+1` work offline. The server re-evaluates every queued POST from the same inputs and is authoritative.

**Why**: Server-only evaluation would undo the local-first discovery from #67 (park has dead zones). The server cannot trust a client flag, so it recomputes from `scan_src`, `listen_quartile`, the position and the exhibit's own GPS from `exhibits.gps_lat/lng`.

**Consequences**: A stale-rules device may count something locally that the server does not confirm. The server total replaces the local value when the queue drains (existing #67 behavior).

### Discovery storage: `discoveries` and `awards`, not `scans`

**Decision**: Two new tables. `scans` keeps meaning "a visitor scanned a physical marker" (marker-lifecycle ops, partnership numbers). `playbacks` is unchanged. `discoveries` is the fact table behind the trail count; `awards` records earned badges and is permanent, so editing a milestone later never changes badges already earned.

```sql
CREATE TABLE discoveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exhibit_id    UUID NOT NULL REFERENCES exhibits(id) ON DELETE CASCADE,
  campaign_id   TEXT NOT NULL,                       -- 'default'
  via           TEXT NOT NULL,                       -- rule id
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),  -- device scanned_at, capped at now()
  UNIQUE (user_id, exhibit_id, campaign_id)
);
CREATE INDEX discoveries_user_campaign ON discoveries (user_id, campaign_id);

CREATE TABLE awards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id  TEXT NOT NULL,
  milestone_id TEXT NOT NULL,                        -- e.g. 'count-5'
  awarded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, campaign_id, milestone_id)
);
```

RLS is enabled on both, with no anon policies (service-role writes only, like `playbacks`). `ON DELETE CASCADE`, not `SET NULL`: these are the visitor's own state, not analytics.

Functions:
- `record_discovery(p_user_id, p_exhibit_id, p_campaign_id, p_via, p_at) RETURNS boolean`: `INSERT … ON CONFLICT DO NOTHING`, true only when the row is new. `p_at` is capped with `LEAST(…, now())` as in `upsert_scan`.
- `total_discovered(p_user_id, p_campaign_id TEXT DEFAULT 'default')`: `COUNT(*)` from `discoveries`. The existing 1-arg call keeps working.

**Why not a synthetic `scans` row** for audio discoveries: it inflates the physical-scan counts. **Why not a `discovered` flag on `playbacks`**: its unique key is per language, so counts would need a distinct-by-exhibit workaround.

**Consequences**:
- The count is by `exhibit_id`, previously by distinct `qr_code_id`. They only differ if an exhibit has two plates.
- `exhibit_qr_codes.exhibit_id` is nullable; unlinked plates are skipped in the backfill.
- `scans.discovered` and `upsert_scan`'s `p_discovered` stay as they are (legacy analytics). Not removed in this story.

### Awards are written server-side but the client does not depend on them

**Decision**: The client computes its own awards locally (`awardsByCampaign`). The server writes `awards` rows for the record, but the API response stays `{ total_discovered }`: no `newly_awarded`, no awarded list.

**Why**: There is no auth yet, so a visitor has one device and nothing reads the server's award list. Cross-device sync of awards is a later story with auth.

### Backfill and deploy order

**Decision**: The migration seeds nothing in a campaigns table, but it backfills:
- `discoveries` from `scans WHERE discovered = true` (joined to `exhibit_qr_codes` for `exhibit_id`), `via='onsite_scan'`, `campaign_id='default'`, `discovered_at = MIN(scanned_at)`.
- `awards` for the nine default thresholds each user already meets (hard-coded in the SQL once), with `awarded_at = now()`.

Apply the migration to production before pushing the code. Re-run the discoveries backfill once after the deploy: it is idempotent (`ON CONFLICT DO NOTHING`) and picks up `scans.discovered` rows the old route wrote during the gap. No `upsert_scan` dual-write.

### POST body: position only where needed

**Decision**: Progress POSTs at `listen_quartile ≥ 50` carry optional `lat`, `lng`, `accuracyM` from `useMapStore.userPosition` when a fix exists. Other POSTs carry none.

**Why**: Only the 50% POST can match `listened_near`; sending less location data is better for privacy.

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
- `awardsByCampaign: Record<string, string[]>` holds earned milestone ids.
- A selector keeps `totalDiscovered` for `default`, so `TrailCard` and `/collection` change only their selector.
- `TRAIL_MILESTONES` becomes derived from `CAMPAIGNS` (the `min` of each `count_discovered` milestone); `trail.ts` keeps its exports.
- `?reveal=N` stays keyed by the milestone's `min`. The redirect uses the newly awarded milestone instead of `getCrossedMilestone`.
- Awards for non-default campaigns are written and kept but nothing renders them.
- The migration moves `discoveredCodes` / `totalDiscovered` into `default`.

**Why**: Keying the store now is cheap; migrating it later with live data is not. Zero visual change keeps this a backend-focused story.

---

## End-to-end flow (worked example)

Asha has 4 `default` discoveries and badges `count-1`, `count-3`. She's offline, 31m from the Banyan Tree (never scanned), and taps Listen on its map pin.

| Event | Device | Queue |
|---|---|---|
| Tap Listen | first-play reported; no match | E1 `{listened:true}` |
| 25% | no match (25 < 50) | E2 `{quartile:25}` |
| **50%** | `listened_near` matches (accuracy 18 ≤ 40, 31 ≤ 50m). codes 4 → 5, total 5; `count-5` newly met; `pendingDiscovery` set | E3 `{quartile:50, lat, lng, accuracyM:18}` |
| 75% | already discovered, no re-eval | E4 |
| 100% (ended) | `handleAudioEnded` → `/collection?reveal=5` | E5 |

On reconnect `flushScanQueue` sends E1–E5 in order. The server for E3 loads the exhibit GPS, recomputes the match, calls `record_discovery` (new), then inserts the `count-5` award. E4 and E5 find the discovery existing. The last response returns `{ total_discovered: 5 }`, which equals the local value.

Final DB: `discoveries` +1 (`via='audio_half_near'`), `awards` +1 (`count-5`), `playbacks` quartile 100, `scans` unchanged.

---

## Implementation Plan

Three slices, three PRs, in order. Slice 1 ships alone with no visitor impact.

### Slice 1: Server foundation

1. Migration `supabase/migrations/<ts>_discoveries_awards.sql`: tables, RLS, `record_discovery`, `total_discovered(user, campaign)`, backfill of `discoveries` and `awards`.
2. `lib/campaigns.ts`: types and `CAMPAIGNS` (default).
3. `lib/discovery.ts`: `PREDICATES`, `matchRule`, `newMilestones`, `MAX_ACCURACY_M = 40`.
4. `app/api/scan/route.ts`: read `lat`, `lng`, `accuracyM`; select `gps_lat, gps_lng` with the exhibit; for each campaign run `matchRule` → `record_discovery` → insert new `awards`; response stays `{ total_discovered }` via `total_discovered(user, 'default')`. The `scans` / `upsert_scan` path is untouched.
5. Tests (below).

### Slice 2: Client model

1. `lib/store.ts`: `discoveredByCampaign`, `awardsByCampaign`, selector for `default`, version bump + migration; `discoverCode` becomes a local evaluation that returns `{ prevTotal, newTotal, milestoneIds }`.
2. `components/ExhibitPageClient.tsx`: the `scanSrc === 'onsite'` branch calls the evaluator.
3. `lib/map-store.ts`: `pendingDiscovery` carries `milestoneIds`.
4. `app/(map)/layout.tsx` `handleAudioEnded`: redirect on the newly awarded milestone, mapped to `min`.
5. `lib/trail.ts`: derive `TRAIL_MILESTONES` from `CAMPAIGNS`; `TrailCard`, `app/collection/page.tsx`: selector swap only.
6. `lib/scan-queue.ts`: the drain writes the `default` total.

### Slice 3: New triggers live

1. Extract first-play/quartile reporting from `ExhibitPageClient` into a shared function; wire it for any exhibit in the sheet (`layout.tsx:128-130`).
2. Attach `lat`, `lng`, `accuracyM` on progress POSTs at quartile ≥ 50.
3. Run the local evaluation on each quartile; skip it when the exhibit's code is already in `discoveredByCampaign.default.codes`.

### Docs, in the same PRs
- `docs/decisions.md`: add "Discovery rules and campaigns"; amend "Offline scans".
- `docs/tech-architecture.md`: new tables, POST fields.
- `docs/user-flows/flow-6-gamification-trail.md`: the three triggers.
- `.claude/current-milestone.md`: update when slices land.

---

## Task Graph

```
S1: migration ─┐
    campaigns.ts ─┼─► route.ts ─► tests ─► [apply migration, deploy, re-run backfill]
    discovery.ts ─┘
                                        │
S2: store + migration ─► evaluator in ExhibitPageClient ─► layout redirect ─► trail adapter
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

- [ ] Migration applies cleanly; `discoveries` / `awards` have RLS on and no anon policy
- [ ] Backfill: every user with `scans.discovered = true` has a matching `discoveries` row; users get `awards` for each default threshold met; re-running adds nothing
- [ ] `total_discovered(user)` (1-arg) still works and equals the old count for existing users, except where one exhibit had two plates
- [ ] Onsite scan online and offline: count and toast unchanged from today; `discoveries` row with `via='onsite_scan'`
- [ ] Audio played to the end from the map sheet of an unscanned exhibit, far away: discovered, `via='audio_complete'`
- [ ] 50% within 50m with accuracy ≤ 40m: discovered at the 50% moment, `via='audio_half_near'`; celebration at audio end, not before
- [ ] 50% at 51m, or with accuracy 41m, or with no fix, or on an exhibit with null GPS: not discovered
- [ ] Replaying the same queued entries twice adds one `discoveries` row and one `awards` row per milestone
- [ ] Server decides from its own exhibit GPS; a forged client position far from the exhibit does not discover
- [ ] The preview sheet reports first-play and quartiles for exhibits other than the current page; the `playbacks` row is created
- [ ] Position is sent only on progress POSTs at quartile ≥ 50
- [ ] Trail bar, `/collection`, and `?reveal=N` behave exactly as before for the default campaign; existing devices keep their total after the store migration
- [ ] `scans` row counts do not change for audio-only discoveries
- [ ] Lint, typecheck, vitest and e2e pass

---

## Testing

- **Unit (`lib/discovery.ts`)**: each predicate and each rule's edge cases (quartile boundaries 49/50/99/100, distance 49/50/51m, accuracy 40/41m, null position, null exhibit GPS); first-match ordering; `newMilestones` with partially awarded ids and a jump over several thresholds.
- **Route test** (Supabase mocked, like existing route tests): each trigger writes the expected `record_discovery` / `awards` calls; unknown exhibit still 404; `scans` path untouched for a non-QR play.
- **Store**: migration from the old `discoveredCodes` / `totalDiscovered` shape; selector for `default`; `discoverCode` returns `milestoneIds` and ignores duplicates.
- **Existing tests updated**: `__tests__/trail.test.ts`, `__tests__/collection-grid.test.tsx`.
- **E2E** (`page.route` mocks, mocked geolocation): onsite scan offline then reconnect; 50% near discovers; 50% far does not; 100% far discovers; map-sheet play for a non-current exhibit sends progress POSTs.
- **Manual on a local prod build** (see the local-test-before-push workflow): a real near/far listen on a phone at the park; check the SQL rows after the queue drains.

---

## Out of Scope

- Campaign sign-up / enrollment, `campaign_exhibits`, the campaign picker UI
- Campaigns or rules stored in the DB; date windows (`startsAt` / `endsAt`)
- Exhibit filters on milestones ("5 gold exhibits"); AND-composed rules; history-based criteria
- Rendering awards of non-default campaigns; cross-device award sync (needs auth, m8)
- Returning `newly_awarded` from the API
- Removing `scans.discovered` or `upsert_scan`'s `p_discovered`
- Tuning the 40m / 50m values (check `via` counts after launch)

---

## Open Questions

1. `scan_src` for map plays: omit (planned), `app` or `map`? Existing `app` is used for the no-audio Listen redirect.
2. Does `maxAccuracyM` apply to trigger 1 and 2 events? Planned: no.
3. Remove the legacy `p_discovered` write to `scans.discovered` later, or keep for analytics?
4. Real exhibits missing GPS: how many? They only discover via triggers 1 and 2.
