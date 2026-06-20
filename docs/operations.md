# Operations — Physical Plate Management

## Plate Specification

- **Material:** Aluminum or ACM (aluminum composite material)
- **Size:** ~A5 (8" × 6")
- **Content:** Sponsor logo + QR code only (no plant name)
- **Mounting:** Bolt-mounted or zip-tied to post near plant
- **Durability:** 5+ years outdoor life
- **QR encoding:** Short URL e.g. `domain.com/s/A7X3`

## Plate Lifecycle

```
[Manufactured] → [Assigned code in DB] → [Installed at location]
      ↓                                         ↓
[GPS + photo captured]                    [Status: Active]
                                                ↓
                              ┌─────────────────┼─────────────────┐
                              ↓                 ↓                 ↓
                    [User reports issue]  [Maintainer flags]  [Plant removed]
                              ↓                 ↓                 ↓
                        [Status: Needs Attention]
                              ↓
                    [Admin reviews → decides action]
                              ↓
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
        [Repair/Remount]  [Reprint]    [Deactivate]
              ↓               ↓               ↓
        [Status: Active] [Status: Active] [Status: Inactive]
```

## Plate States

| State | Meaning |
|-------|---------|
| Active | Working, mapped to plant, serving content |
| Needs Attention | Issue reported (damage, wrong plant, missing) — awaiting admin review |
| Inactive | Deliberately disabled (plant removed, area closed) — shows "coming soon" page |

## Roles

### Admin (You, initially)
- Reviews all reports and maintenance submissions
- Approves actions that cost money (reprint, new plate)
- Assigns work to maintainer
- Manages QR → plant mappings
- Views telemetry / analytics

### Maintainer (Field person)
- Quarterly walk-through of all plates
- Scans each QR → sees maintenance checklist
- Submits report with photo
- Executes fixes (remount, clean, replace)
- Marks issues as resolved after fixing

## Maintenance Checklist (Per Plate)

When maintainer scans a QR in admin mode:

- [ ] Plate visible and findable?
- [ ] QR code scannable? (test scan)
- [ ] Correct plant still nearby?
- [ ] Plate undamaged? (no cracks, fading, graffiti)
- [ ] Mounting secure? (not loose, tilted, fallen)
- [ ] Photo taken for records

## Audit Schedule

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Full walk-through (all plates) | Quarterly | Maintainer |
| Spot checks (random 10 plates) | Monthly | Maintainer or park staff |
| Report review | As reports come in | Admin |
| Data reconciliation (DB vs field) | Biannually | Admin |

## Installation Process (New Plate)

1. Assign short code in database
2. Map code to plant (name, species, GPS coordinates)
3. Generate and print QR plate with sponsor logo
4. Install at location (photo + GPS logged)
5. Test scan from installed position
6. Mark status: Active
7. Content must be live before installation

## Database Fields Per Plate

| Field | Type | Purpose |
|-------|------|---------|
| code | string | Short code (e.g., "A7X3") |
| plant_id | FK | Links to plant record |
| sponsor_id | FK | Links to sponsor |
| ad_tier | enum | gold / silver / bronze |
| gps_lat | float | Installed location |
| gps_lng | float | Installed location |
| install_date | date | When installed |
| last_checked | date | Last maintenance check |
| status | enum | active / needs_attention / inactive |
| notes | text | Free-form notes |
