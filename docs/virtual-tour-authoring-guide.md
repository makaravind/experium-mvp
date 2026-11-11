# Virtual Tour Authoring Guide (`/admin/tour`)

How to turn the 41 seeded panoramas into a walkable street-view graph. Dev-only tool; writes to the **live** Supabase DB. Spec: `docs/specs/m9b-virtual-tour-navigation.md`.

## What you are building

Three things, all by eye (panos have no compass data, so nothing can be computed):

| Thing | What it is | You supply |
|---|---|---|
| **Node position** | where a pano was shot | click on the park map |
| **Edge** (arrow) | "from pano A you can walk to pano B" | which pairs connect, then the direction in A's pano where B appears |
| **Exhibit pin** | a marker inside a pano that opens the exhibit | which node it belongs to, then where it appears in the pano |

An edge is **directed**: A→B and B→A are separate rows, and each needs its **own click** in its own pano (the camera faces a different way in each).

Node `1` is the lobby (label "Park Entrance"); it is where the tour starts. 41 nodes total: `1`–`40` and `37A`.

## Start

```
cd experium-ai-tour-app
git checkout impl/m9b          # already on it
npm run dev
```

Open `http://localhost:3000/admin/tour`. Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. It 404s in production builds.

Top bar has five modes, in workflow order: **Place → Edges → Aim → Link → Save**. A line shows "No unsaved changes" or a diff summary.

## ⚠ Read first: edits are staged in the browser

- Nothing reaches the DB until **Save**. There is **no unsaved-changes warning**: reloading or closing the tab loses everything unsaved.
- Save often. With blockers present, tick *"Save work-in-progress anyway"* → **Save anyway**. That writes node positions, labels, aimed edges and exhibit links.
- **Unaimed edges are NOT written** by a WIP save. So accepted-but-not-yet-aimed edges vanish on reload. Do edges and aiming in the same sitting, in small clusters, and save after each cluster.

## 1. Place (get all 41 nodes on the map)

Left: node list (thumbnail, label, pano ref, ✓ placed / ✗ not placed). Right: park map.

1. Click a node's **thumbnail** to enlarge the pano preview (Esc / ✕ / click backdrop to close). Use it to recognise where you are standing.
2. Click the node's **row** to select it (the cursor becomes a crosshair).
3. Click the matching spot on the map. The node appears as a numbered dot.
4. Next node. Click an existing dot to re-select it, then click elsewhere on the map to **move** it. *Clear position* un-places it. You can edit the **label** (shown in the node pill in the tour).

Tips:
- Work in numeric order; neighbours are usually adjacent numbers, which makes placement easy.
- Use the red-dot capture-spot map (the PDF you shot from) as the reference for where `1`–`40` sit. `37A` has no dot on it: place it next to `37`, judging from its preview.
- Accuracy needs to be "about right" (a few metres). It drives edge proposals and the map recentre on tour exit, not the arrows.

Done when the header shows `41/41 placed`. **Save** (WIP is fine).

## 2. Edges (which nodes connect)

Map shows placed nodes (blue dots; the selected one is orange). Lines: **yellow dashed = proposed**, **green solid = accepted**.

1. **Propose edges**. The tool snaps nodes to the park path network and proposes neighbours along each path; nodes far (> 40 m) from any path get their 3 nearest nodes instead.
2. Review on the map. Click a line to pick it, then **Accept** / **Reject** (or **Accept all** / **Reject all** if it looks right).
3. Missing a link? Select a node (list or map dot) → **Add edge from selected** → click the target node.
4. Wrong accepted edge? Click the green line → **Remove**.

Accepting a pair creates **both directions** (A→B and B→A). The list shows each node's neighbour count (`3 ↔`).

Rule of thumb: connect nodes you can actually walk between in a straight, short hop. Don't connect across lakes/fences. 2–3 neighbours per node is typical; dead ends have 1.

Make sure the lobby (`1`) connects onward, so every node is reachable from it.

## 3. Aim (the click-in-the-panorama step, ~100 times)

This is the bulk of the work. For every outgoing edge from a node, you point at where the next node is **in this node's panorama**.

1. Pick a node from the **Node** dropdown (or use **Go →** next to an edge to jump to its target).
2. The pano loads on the right. The panel lists **Outgoing edges** and **Exhibits here**, each with a status: `✗ unaimed` or `✓ yaw …° · pitch …°`.
3. Click an edge row (it arms; the cursor becomes a crosshair). Drag the pano to look around until you see where the path leads to the next node, then **click that spot** (path surface in the distance / where the next pano's location is). Click the row again to cancel without aiming.
4. A blue `➤ <node>` pill appears where you clicked. That is exactly where the arrow will sit in the live tour. Re-arm and click again to correct it.
5. Click an already-aimed row to swing the view back to its pill and check it.

Tips:
- Aim at the **ground/path** ahead, slightly below the horizon, like the arrows in Google Street View. The tool stores both yaw and pitch from your click.
- Work node by node: aim all outgoing edges of node N, then Go → to a neighbour and aim its edge back (the reverse click is a different spot).
- Cross-check using the target node's thumbnail: its direction of view should match what you see ahead.
- If an arrow ends up wrong in the live tour, come back here, re-arm that edge and re-click.

## 4. Link (exhibits ↔ nodes)

Each exhibit can appear as an orange pin inside **one** node's pano (the nearest one).

1. **Propose links** (radius defaults to 40 m; adjust if too few/many). The tool proposes the nearest placed node within the radius for each exhibit with GPS.
2. Per row: change the proposed node, **Accept**, or drop it; **Accept all** takes everything. **Clear** unlinks.
3. Exhibits with no pano nearby (e.g. markers 41+) stay unlinked. That is expected.
4. **Aim →** on a linked exhibit (or switch to Aim mode → *Exhibits here*), click the exhibit's real-world position in that node's pano. An amber `📍 <name>` pill appears.
5. A linked exhibit **must** be aimed, otherwise Save is blocked.

## 5. Save

The Save tab shows the change summary and **Blockers**. All must be cleared for a normal **Save**:

| Blocker | Fix |
|---|---|
| N node(s) without a position | Place them (mode 1) |
| N edge(s) without a yaw | Aim them (mode 3) |
| N edge(s) missing the reverse | Add the reverse edge, or remove the one-way edge |
| N exhibit(s) linked to a node without a yaw/pitch | Aim them (modes 3 / 4) |
| No lobby node | Exactly one node must be the lobby (`1`) |
| N node(s) unreachable from the lobby | Connect them with edges back to the graph |

Save is atomic (one DB function, `admin_apply_tour`). Reload afterwards to confirm everything persisted.

## 6. Check it in the real tour

Open `http://localhost:3000/tour` (start at the lobby) and walk the whole graph on a phone-sized viewport:

- Tap each arrow. It should move you in the direction it points.
- Walk back. The return arrow should point back the way you came.
- Tap an orange pin. The exhibit preview sheet opens.
- Tap the **Map** pill. You land on the map centred on your last node, with a "360°" pin there.

Fix any bad arrow/pin back in **Aim**, save, and refresh `/tour`.

## 7. Tell Claude when the graph is saved

Then it will export the final graph as a seed migration (`supabase/migrations/…_seed_tour_graph.sql`) so it is reproducible, and verify: lobby → node `1` reachable, all 41 nodes reachable from the lobby, no orphan edges.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Lost my work after refresh | Edits were unsaved. Save more often (see ⚠ above) |
| "Propose edges" disabled | Fewer than 2 placed nodes |
| Edges mode shows nothing after reload | Unaimed edges aren't saved by a WIP save; redo and aim before saving |
| Click in pano doesn't aim | Arm an edge/exhibit row first (crosshair cursor); clicking a pill doesn't aim |
| Pano stuck on "Loading panorama…" | Tiles not uploaded for that node, or `tiles_url` wrong; check `panoramas/<ref>/manifest.json` in Supabase Storage |
| Page 404 | Not running `next dev` (the tool is disabled in production builds) |
