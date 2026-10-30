# Flow 8: Virtual Tour (360° Street View)

## Version: V2

## Summary

Visitor enters a panoramic street view anchored to a park exhibit → navigates the park freely via node graph → taps exhibit markers to open exhibit pages → returns to map view.

**Online-only.** Panoramas are not precached; entry points are hidden when offline.

---

## Entry Paths

### A — From Exhibit Gallery (primary)

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Exhibit bottom sheet | Views exhibit | If exhibit has `tour_node_id`: Gallery shows a 360° slide as the last carousel item. A "360°" badge appears on the 56×56 exhibit thumbnail in the sheet header. |
| 2 | Exhibit bottom sheet | Swipes to the 360° gallery slide, taps it | Bypasses the gallery fullscreen modal. Navigates to `/tour?node=<tour_node_id>&heading=<tour_heading>&exhibitId=<exhibitId>` |
| 3 | Tour Viewer | Panorama renders | Viewer initialises at `tour_heading` (compass bearing). Nav arrows appear for each connected node. Exhibit markers appear for exhibits linked to this node. A collapsed strip at the bottom shows the entry exhibit. |
| 4 | Tour Viewer | Explores / navigates | See screen states below |

### B — From Virtual Tour QR Code (physical marker in park)

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | — | Scans physical "Virtual Tour" QR code | Opens `/s/[code]?mode=virtual-tour` |
| 2 | Exhibit page | Page loads with `mode=virtual-tour` | Reads `tour_node_id` + `tour_heading` from cached exhibit data. Redirects to `/tour?node=<id>&heading=<degrees>&exhibitId=<id>` |
| 3 | Tour Viewer | Panorama renders | Same as Entry Path A, step 3 |

### C — From Home Screen

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Home | Taps "360° Virtual Tour →" button | Navigates to `/tour` (no node param) |
| 2 | Tour Viewer | Page loads | Fetches `tour_nodes WHERE is_lobby = true LIMIT 1`. Renders panorama at lobby node. No collapsed exhibit strip (no `exhibitId` param). |

### D — Node-to-node navigation (within viewer)

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Tour Viewer | Taps a nav arrow | Panorama transitions to the connected node |
| 2 | Tour Viewer | New node renders | Nav arrows update to edges from new node. Exhibit markers update to exhibits linked to the new node. URL stays static (no replace). |

---

## Screen States

### S1: Tour Viewer (`/app/tour/page.tsx`)

- **Route:** standalone page outside the `(map)` layout group — no MapShell, no tab bar
- **Technology:** `@photo-sphere-viewer/core` + `virtual-tour-plugin` + `markers-plugin`
- **Panorama source:** `tour_nodes.tiles_url` (direct image URL in v1; tile config in v2 via `equirectangular-tiles-adapter`)
- **Image spec:** 4096×2048 JPEG 85% (~2.8MB/image); resized locally from 12K masters via `sips`, hosted on Supabase Storage
- **Preload:** `preload: true` on `VirtualTourPlugin` — prefetches all adjacent nodes' panoramas on node enter; nav transitions feel instant
- **v2 tiling:** `EquirectangularTilesAdapter` set at Viewer level; nodes pass a tile config object (preview + level URLs) instead of a plain URL; storage size unchanged (~2.9MB/image in tiles vs 2.8MB single JPEG) but first render drops from 2–3s to <0.5s (PSV loads 15KB preview + ~6 visible tiles immediately)
- **Initial heading:** `tour_heading` URL param (compass bearing, degrees) — only on entry; node transitions default to direction of travel
- **Data loading:** all `tour_nodes` + `tour_edges` fetched upfront on mount (single query, small dataset)
- **Nav arrows:** marker hotspots for each outgoing edge from the current node; positioned at `tour_edges.bearing` (admin-specified yaw, 0–359°)
- **Exhibit markers:** hotspot pins for every exhibit where `tour_node_id` = current node; positioned at `exhibits.tour_heading` (same value used as marker yaw); same orange/green visited state as map; tapping navigates to `/s/[qr_code]`
- **Back to map:** persistent button (top-left); `router.push('/map')`
- **URL:** static — `/tour?node=<nodeId>&heading=<degrees>&exhibitId=<id>`; does not update on node transitions
- **Offline:** entry points hidden; if connection drops mid-tour, panorama load fails with "Needs internet" toast

### S2: Collapsed Exhibit Strip (inside viewer)

Shown only when `exhibitId` param is present (entry from exhibit gallery or virtual tour QR).

- Persistent pill at the bottom of the viewer showing the entry exhibit name
- Tapping navigates to `/s/[qr_code]` (the full exhibit page with audio player)
- Back gesture / swipe-back returns to `/tour?...` (browser history)
- Not shown when entering from home screen (no `exhibitId` param)

### S3: Exhibit Marker Tap (inside viewer)

- Tapping an exhibit marker navigates to `/s/[qr_code]`
- Full exhibit page opens (audio, facts, language selector)
- Back returns to `/tour?...` (browser history, static URL)
- Works for any exhibit at the current node, not just the entry exhibit

---

## Home Screen Change

The existing "Explore the Park →" button is renamed to **"360° Virtual Tour →"** and links to `/tour` (no node param — resolves lobby node on load). No new card or modal is added.

---

## Data Model

### New Tables

```sql
CREATE TABLE tour_nodes (
  id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  tiles_url     TEXT     NOT NULL,  -- URL to PSV tile manifest JSON (tile pyramid on Supabase Storage)
  is_lobby      BOOLEAN  NOT NULL DEFAULT false
  -- lat/lng not stored; exhibit nodes use exhibits.gps_lat/lng; path-only nodes need no GPS
);

CREATE TABLE tour_edges (
  from_node_id UUID     NOT NULL REFERENCES tour_nodes(id) ON DELETE CASCADE,
  to_node_id   UUID     NOT NULL REFERENCES tour_nodes(id) ON DELETE CASCADE,
  bearing      SMALLINT NOT NULL,  -- admin-specified yaw in panorama toward to_node (0–359°)
  PRIMARY KEY (from_node_id, to_node_id)
  -- bidirectional: each connected pair stored as two rows with their own bearing
);
```

### Exhibits Additions

```sql
ALTER TABLE exhibits
  ADD COLUMN tour_node_id UUID     NULL REFERENCES tour_nodes(id) ON DELETE SET NULL,
  ADD COLUMN tour_heading SMALLINT NULL;
  -- tour_node_id NULL  = no virtual tour entry for this exhibit
  -- tour_heading       = initial viewer bearing on entry AND marker yaw in the panorama
```

### Key relationships

| Relationship | How |
|---|---|
| Exhibit has a tour node | `exhibits.tour_node_id IS NOT NULL` |
| Multiple exhibits at one node | Many `exhibits` rows share the same `tour_node_id` |
| Path-only node (no exhibit) | `tour_nodes` row with no `exhibits` pointing to it |
| Default home screen entry | `tour_nodes.is_lobby = true` |
| Nav arrow direction | `tour_edges.bearing` (admin-set, not computed from GPS) |
| Exhibit marker yaw | `exhibits.tour_heading` (doubles as entry heading and marker position) |

### exhibit_photos — unchanged

Tile manifests live on `tour_nodes.tiles_url`, not in `exhibit_photos`. The `exhibit_photos` table remains pure (regular exhibit images only).

### CachedExhibit type additions (app types)

`CachedExhibit`, `PreviewExhibit` need two new nullable fields:
- `tour_node_id: string | null`
- `tour_heading: number | null`

The precache API (`/api/exhibits/all`) must include these fields so the exhibit page can resolve the tour redirect without a network call.

---

## Gallery Integration

- `Gallery` receives an optional `onTourEnter` callback
- When the 360° slide is tapped, `onTourEnter()` fires instead of opening `FullscreenModal`
- The 360° slide only renders if the exhibit has `tour_node_id != null`
- The 360° slide is the last slide in the carousel
- The 56×56 exhibit thumbnail in `PreviewSheet` shows a small "360°" badge when `tour_node_id` is set

---

## Out of Scope (V1)

- Offline panorama precaching
- Cross-node proximity markers (exhibits shown on nodes they aren't directly linked to)
- Cluster markers when multiple exhibits share a node
- Indoor / multi-floor nodes
- Admin UI for authoring nodes and edges (use Supabase dashboard)
- Bearing auto-computation from GPS (admin sets `tour_edges.bearing` manually)
