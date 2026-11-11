# Flow 8: Virtual Tour (360° Street View)

## Version: V2

## Summary

Visitor enters a panoramic street view anchored to a park exhibit → navigates the park freely via node graph → taps exhibit pins to open the exhibit's preview sheet → exits to the map, landing where they stood (with a persisted 360° pin).

**Online-only.** Panoramas are not precached; entry points are hidden when offline.

---

## Entry Paths

### A — From Exhibit Gallery (primary)

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Exhibit bottom sheet | Views exhibit | If exhibit has `tour_node_id`: Gallery shows a 360° slide as the first carousel item (the gallery opens on it). A "360°" badge appears on the 56×56 exhibit thumbnail in the sheet header. |
| 2 | Exhibit bottom sheet | Taps the 360° gallery slide (first slide) | Bypasses the gallery fullscreen modal. Navigates to `/tour?node=<tour_node_id>&heading=<tour_heading>&exhibitId=<exhibitId>` |
| 3 | Tour Viewer | Panorama renders | Viewer initialises at `tour_heading` (yaw in the pano, degrees). Nav arrows appear for each connected node. Exhibit pins appear for exhibits linked to this node. A collapsed strip at the bottom shows the entry exhibit. |
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
| 2 | Tour Viewer | New node renders | Nav arrows update to edges from new node. Exhibit pins update to exhibits linked to the new node; any open `PreviewSheet` closes. Node-name pill updates. URL stays static (no replace). |

### E — Exit to map

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Tour Viewer | Taps "← Map" pill, or "Navigate" in an exhibit's `PreviewSheet` | `ExitSplash` ("Back to the map · Landing at <node label> · Spot saved · Centring the map") for 0.6 s. Writes `tourSpot = { nodeId, lat, lng, heading, label, at }` to the persisted store (skipped if the node has no `lat/lng`), then `router.push('/map')` |
| 2 | Map | Mounts | If `tourSpot.at` is within 10 s and not already flown to: `flyToTourSpotTrigger` → map flies to the node (zoom 19). After "Navigate": the map instead opens that exhibit's sheet and centres on it |
| 3 | Map | Views map | 360° pin (white puck + "360°" chip, no view cone) stays at the saved spot, across reloads |

### F — Re-enter from the 360° pin

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Map | Taps the 360° pin | Navigates to `/tour?node=<nodeId>&heading=<heading>`; the spot is kept |
| 2 | Map | Taps the pin's ✕ | Clears `tourSpot` |

Entering the tour any other way (home button, gallery slide, QR) clears the old spot; the next exit writes a fresh one.

---

## Screen States

### S1: Tour Viewer (`/app/tour/page.tsx`)

- **Route:** standalone page outside the `(map)` layout group — no MapShell, no tab bar
- **Technology:** `@photo-sphere-viewer/core` + `virtual-tour-plugin` (server mode) + `markers-plugin` + `equirectangular-tiles-adapter`
- **Panorama source:** tile pyramid per node on Supabase Storage (`panoramas` bucket); `tour_nodes.tiles_url` is the `manifest.json`. First render loads `base.jpg` + visible tiles (<0.5 s vs 2–3 s for a single JPEG)
- **Node loading:** `VirtualTourPlugin` `dataMode: 'server'` — a node and its arrows resolve on demand via `getNode`; a neighbour's manifest is fetched only when preloaded or tapped. The graph (`tour_nodes` + `tour_edges`, small) is fetched once on mount. A neighbour that fails to load shows a "Couldn't load that spot" toast and the viewer stays put
- **Preload:** `preload: true` — with the tiles adapter this prefetches each neighbour's `base.jpg` only (not its first tiles)
- **Initial heading:** `heading` URL param (degrees → radians) — only on entry; node transitions default to direction of travel
- **Nav arrows:** plugin links for each outgoing edge; positioned at `tour_edges.bearing` (yaw) + `tour_edges.pitch`, both authored by clicking the target in the panorama (`/admin/tour`); label = target node's `label`
- **Exhibit pins:** `MarkersPlugin` markers for every exhibit where `tour_node_id` = current node and `tour_heading` + `tour_pitch` are set; numbered with the display ID; orange (unvisited) / green (visited) from the visitor's discovered set, same as map pins
- **Pin tap → `PreviewSheet`:** `/tour` mounts the same `PreviewSheet` the map uses, fed from the cached dataset (`cachedExhibits`, cached audio — listening works offline from cache). The sheet's own 360° badge/slide is suppressed (already in the tour). Close = tap the panorama; walking to another node also closes it. **Navigate** = exit flow (Entry E) → `/map` with that exhibit's sheet open and centred; the visitor taps Navigate on the map to start a route. There is no tour-only card and no navigation to `/s/[code]`
- **Back to map:** persistent "← Map" pill (top-left); the only exit — runs the exit flow (Entry E). Node-name pill (top-centre) shows the current node's label
- **Start splash:** `TourSplash` over the loading panorama, min 0.8 s; slow / offline states offer cancel, keep waiting, retry
- **URL:** static — `/tour?node=<nodeId>&heading=<degrees>&exhibitId=<id>`; does not update on node transitions
- **Offline:** entry points hidden; if connection drops mid-tour, panorama load fails with "Needs internet" toast

### S2: Collapsed Exhibit Strip (inside viewer)

Shown only when `exhibitId` param is present (entry from exhibit gallery or virtual tour QR).

- Persistent pill at the bottom of the viewer showing the entry exhibit name
- Tapping navigates to `/s/[qr_code]` (the full exhibit page with audio player)
- Back gesture / swipe-back returns to `/tour?...` (browser history)
- Not shown when entering from home screen (no `exhibitId` param)

### S3: Exhibit Pin Tap (inside viewer)

- Tapping a pin opens `PreviewSheet` for that exhibit (audio, facts, language selector from cache)
- Works for any exhibit at the current node, not just the entry exhibit
- Tapping the panorama (not a pin) closes the sheet

---

## Home Screen Change

"Explore the Park →" is kept. A second button, **"360° Virtual Tour →"**, is added below it and links to `/tour` (no node param — resolves the lobby node on load). Hidden offline. No new card or modal.

---

## Data Model

### New Tables

```sql
CREATE TABLE tour_nodes (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT     NOT NULL,        -- node pill text; 'Park Entrance', 'Node 14'
  pano_ref    TEXT     NOT NULL UNIQUE, -- capture-spot label: '1'…'40', '37A', 'lobby'
  tiles_url   TEXT     NOT NULL,        -- manifest.json URL (tile pyramid in the `panoramas` bucket)
  preview_url TEXT     NOT NULL,        -- 1024x512 preview.jpg URL
  lat         FLOAT8   NULL,            -- set in /admin/tour (click on the map); NULL = unplaced
  lng         FLOAT8   NULL,
  is_lobby    BOOLEAN  NOT NULL DEFAULT false  -- unique partial index: one lobby
);

CREATE TABLE tour_edges (
  from_node_id UUID     NOT NULL REFERENCES tour_nodes(id) ON DELETE CASCADE,
  to_node_id   UUID     NOT NULL REFERENCES tour_nodes(id) ON DELETE CASCADE,
  bearing      SMALLINT NOT NULL CHECK (bearing BETWEEN 0 AND 359),  -- yaw in from_node's pano toward to_node
  pitch        SMALLINT NOT NULL DEFAULT -15 CHECK (pitch BETWEEN -90 AND 90),
  PRIMARY KEY (from_node_id, to_node_id)
  -- bidirectional: each connected pair stored as two rows, each aimed in its own pano
);
```

Both tables: anon `SELECT`, authenticated `ALL`. Panoramas are not assumed north-aligned (no EXIF/XMP yaw), so `bearing`/`pitch` are never computed from GPS.

### Exhibits Additions

```sql
ALTER TABLE exhibits
  ADD COLUMN tour_node_id UUID     NULL REFERENCES tour_nodes(id) ON DELETE SET NULL,
  ADD COLUMN tour_heading SMALLINT NULL CHECK (tour_heading BETWEEN 0 AND 359),
  ADD COLUMN tour_pitch   SMALLINT NULL CHECK (tour_pitch BETWEEN -90 AND 90);
  -- tour_node_id NULL = no virtual tour entry (exhibits at markers 41+ have no pano)
  -- tour_heading/pitch = pin position in the node's pano AND initial viewer yaw on entry
```

### Key relationships

| Relationship | How |
|---|---|
| Exhibit has a tour node | `exhibits.tour_node_id IS NOT NULL` |
| Multiple exhibits at one node | Many `exhibits` rows share the same `tour_node_id` |
| Path-only node (no exhibit) | `tour_nodes` row with no `exhibits` pointing to it |
| Default home screen entry | `tour_nodes.is_lobby = true` |
| Nav arrow position | `tour_edges.bearing` + `tour_edges.pitch` (authored by click, not computed from GPS) |
| One node per exhibit | `exhibits.tour_node_id` (many exhibits may share a node) |
| Exhibit pin position | `exhibits.tour_heading` + `exhibits.tour_pitch` (heading doubles as entry heading) |
| Last tour spot | `tourSpot` in the persisted store (client only, not in the DB) |

### exhibit_photos — unchanged

Tile manifests live on `tour_nodes.tiles_url`, not in `exhibit_photos`. The `exhibit_photos` table remains pure (regular exhibit images only).

### CachedExhibit type additions (app types)

`CachedExhibit`, `PreviewExhibit` carry nullable `tour_node_id`, `tour_heading`, `tour_pitch` (+ `tour_preview_url` for the splash backdrop).

The precache API (`/api/exhibits/all`) includes these fields so the exhibit page can resolve the tour redirect and pins render without a network call.

### TourSpot (persisted store, `lib/store.ts` v7)

`{ nodeId, lat, lng, heading, label, at }`. `heading` is the last view yaw in degrees (not a compass bearing). The v6 → v7 migration adds `tourSpot: null` and **keeps** the cached dataset (earlier bumps dropped it).

---

## Authoring

Dev-only `/admin/tour` (`npm run dev`, 404 in production; edits the live DB). Staged client-side, saved atomically via `admin_apply_tour(changes jsonb)`. Modes: **Place** (click the map to set node `lat/lng`, edit label) → **Edges** (proposals from `public/park-paths.json` with nearest-neighbour fallback; accepting creates both directed rows) → **Aim** (embedded viewer; click the target in the panorama to store yaw + pitch for each edge/exhibit pin) → **Link exhibits** (nearest placed node within a radius, human overrides) → **Validate + Save** (blockers: unplaced node, edge without yaw, missing reverse edge, linked exhibit without yaw/pitch, no lobby, nodes unreachable from the lobby). The 42-node production graph is authored through this tool (not seeded by a migration). See `docs/specs/m9b-virtual-tour-navigation.md`.

---

## Gallery Integration

- `Gallery` receives an optional `onTourEnter` callback
- When the 360° slide is tapped, `onTourEnter()` fires instead of opening `FullscreenModal`
- The 360° slide only renders if the exhibit has `tour_node_id != null`
- The 360° slide is the first slide in the carousel (index 0); photo slides follow
- The 56×56 exhibit thumbnail in `PreviewSheet` shows a small "360°" badge when `tour_node_id` is set

---

## Out of Scope

- Offline panorama precaching
- Minimap (deferred)
- View cone on the 360° map pin (panos aren't north-aligned)
- Cross-node proximity markers (exhibits shown on nodes they aren't directly linked to)
- Cluster markers when multiple exhibits share a node
- Indoor / multi-floor nodes
- Bearing auto-computation from GPS
