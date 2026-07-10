# Open Questions

## Blocks Development (Drone Survey)

| # | Question | Context | Notes |
|---|----------|---------|-------|
| 20 | Which photogrammetry software does the operator use? | ODM, Agisoft, DJI Terra — affects output quality and format | Ask before booking |
| 21 | Can the park provide a boundary shapefile or GPS waypoints for the 90-acre exhibit zone? | Operator needs this to define flight area | Alternative: walk the boundary with a GPS app |
| 22 | Survey timing — before or after exhibit GPS coords are finalized? | If after, exhibit pins can be placed on the real ortho for accuracy check | Recommend: survey first, then GPS-tag exhibits against the ortho |

## Blocks Development

| # | Question | Context | Notes |
|---|----------|---------|-------|
| 1 | Final brand name and domain? | QR codes encode a permanent URL — domain must be decided before first marker is printed | Working title: "Nature Audio Tour" |
| 2 | ~~Gamification mechanics?~~ | ~~Game design affects DB schema, user model, and UI flows~~ | **RESOLVED** — see decisions.md § Gamification. Trail ladder + milestones + illustrated map + discovery cards |

## Blocks Launch

| # | Question | Context | Notes |
|---|----------|---------|-------|
| 3 | Revenue split % with park after cost recovery? | Need this for partnership agreement | Options: 60/40, 70/30 in our favor (we bear all tech + ops costs) |
| 4 | Park's primary motivation framing? | Drives pitch angle — "premium visitor experience" vs "passive revenue" vs "visitor data insights" | Likely experience differentiation for a ₹1000/entry premium park |
| 5 | Who are the domain experts? | Need to schedule interviews before content can be created | Botanist for plants, historian/geologist for structures and landmarks |
| 6 | Sponsor acquisition strategy? | Who approaches local businesses? What's the pitch? What price? | Target: 3-5 direct ad slots, ₹5K-15K/month each |
| 7 | Park communication clause? | How do we get notified of landscape changes (exhibits moved/removed/replaced)? | Risk: stale content without contractual obligation |
| 8 | Number of exhibits for Phase 1? | Determines marker order quantity, content workload, initial investment | Estimate: 40-60 across all types (plants, structures, water bodies, landmarks) |

## Post-Launch

| # | Question | Context | Notes |
|---|----------|---------|-------|
| 9 | Privacy policy for user data (name/phone/email)? | Required before collecting info on first-load modal | No OTP in v1; plain optional inputs stored locally then synced |
| 10 | Ad disclosure requirements? | Legal requirement to mark sponsored content | "Sponsored" label on ads |
| 11 | Partnership agreement terms? | Formal contract with Experium | Needs legal review |
| 12 | Multi-park expansion criteria? | When/how to approach park #2 | Not focusing on this now — revisit after Experium proves the model |
| 13 | Reward for gamification (park restaurant discount, etc.)? | Requires park cooperation and agreement | Gamification UX resolved; physical rewards still open — needs park agreement |

## TODO (Deferred)

| # | Item | Context |
|---|------|---------|
| 14 | Migrate existing codes (NM01→PL01 etc.) or keep as permanent aliases? | New exhibits use type-prefix scheme; existing MVP codes still work |
| 15 | Per-type audio script guidance | Document different approaches when first non-plant exhibit is created |
| 16 | Per-type discovery badges | v2 gamification — "3 plants, 1 lake discovered" style |
| 17 | ~~GPS → 3D coordinate mapping~~ | **RESOLVED** — Mapbox uses real WGS84 lat/lng natively; Three.js coordinate projection no longer needed |
| 18 | Category A/B/C initial assignment | All exhibits start as B; when to do first reassignment pass (after 2-4 weeks of scan data?) |
| 19 | Service worker cache strategy | ~25MB initial download (50 × 500KB audio + map). Progressive or all-at-once? Loading UX for slow connections? |
