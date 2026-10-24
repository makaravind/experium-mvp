# Flow 8: Virtual Tour (360° Street View)

## Version: V1

## Summary

Visitor taps the 360° thumbnail on an exhibit page → enters a panoramic street view anchored to that exhibit's location → navigates the park freely → taps exhibit markers to open exhibit pages → returns to map view.

**Online-only.** Panoramas are not precached; the entry point is hidden when offline.

---

## Entry Paths

### A — From Exhibit Page (primary)

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Exhibit Page | Views exhibit bottom sheet / page | If exhibit has a linked tour node: 360° thumbnail is visible |
| 2 | Exhibit Page | Taps 360° thumbnail / "Enter Virtual Tour" | 360 Viewer opens, panorama loads at the exhibit's linked node |
| 3 | 360 Viewer | Panorama renders | Viewer initialises at `tour_heading` (compass bearing) defined for this exhibit. Navigation arrows appear for connected nodes |
| 4 | 360 Viewer | Explores / navigates | See screen states below |

### B — Navigation from another node

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | 360 Viewer | Taps a navigation arrow | Panorama transitions to the connected node |
| 2 | 360 Viewer | New node renders | Navigation arrows update to connected nodes from the new position. Exhibit markers update to exhibits linked to this node |

---

## Screen States

### S1: 360 Viewer

- **Technology:** equirectangular panorama viewer (`@photo-sphere-viewer/core` or equivalent)
- **Panorama source:** `tour_nodes.panorama_url` (remote URL, no precache)
- **Initial heading:** `exhibits.tour_heading` (compass bearing, degrees) — only applies on entry from an exhibit page; subsequent node transitions default to the direction of travel
- **Navigation arrows:** rendered as overlay hotspots for each edge in `tour_edges` from the current node, pointing in the bearing toward the connected node
- **Exhibit markers:** hotspot pins for every exhibit whose `tour_node_id` = current node; same orange/green visited state as the map
- **Back to map:** persistent button (top-left); returns to Map tab, restoring last map position
- **Offline:** entry point hidden; if connection drops mid-tour, panorama load fails with "Needs internet" toast

### S2: Exhibit Marker Tap (inside viewer)

- Tapping an exhibit marker opens the exhibit's bottom sheet / page (same as tapping a pin on the map)
- Audio can be played from here
- "Back" from the exhibit page returns to the 360 Viewer at the same node

---

## Data Model (summary)

| Table | Key columns | Notes |
|-------|-------------|-------|
| `tour_nodes` | `id`, `panorama_url`, `lat`, `lng`, `label` | One row per 360 capture position |
| `tour_edges` | `from_node_id`, `to_node_id` | Manual graph; bidirectional edges stored as two rows |
| `exhibits` | `tour_node_id` (FK, nullable), `tour_heading` (int, nullable) | Null = no 360 entry for this exhibit |

---

## Out of Scope (V1)

- Offline panorama precaching
- Exhibits as markers on nodes they are not directly linked to (cross-node proximity markers)
- Cluster markers when multiple exhibits share a node
- Indoor / multi-floor nodes
- Admin UI for authoring nodes and edges (use Supabase dashboard)
