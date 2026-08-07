# Interactive Park Map — Mapbox GL JS + Drone Orthophoto

> **Decision (2026-07-10):** Three.js/R3F illustrated map replaced by Mapbox GL JS with a real drone orthophoto raster tileset. Real photo is more accurate and recognizable to visitors; no Blender modeling required. See `docs/drone-survey-mapbox.md` for survey spec and processing pipeline.

## Overview

Mapbox GL JS map with drone orthophoto overlaid as a raster tileset. Visitors pan/zoom and tap exhibit pins to trigger audio playback. GPS "you are here" dot via `watchPosition()`.

---

## Trail Routing Between Landmarks

**Approach:** Draw physical trail *segments* as GeoJSON, then chain them with BFS to route between any two landmarks. No pre-drawing routes per pair, no routing library.

**Why not cross-product routes?** N landmarks = N×(N-1)/2 hand-drawn routes (20 landmarks = 190 routes). Segments model avoids this — draw only the ~15–30 physical paths that exist in the park; routing is derived.

### Data Model

Each GeoJSON feature is a **physical trail segment** connecting two adjacent nodes (landmarks or trail intersections):

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "seg-baobab-junction1",
      "properties": { "connects": ["baobab", "junction1"] },
      "geometry": { "type": "LineString", "coordinates": [[78.3456, 17.4321], [78.3467, 17.4335]] }
    },
    {
      "type": "Feature",
      "id": "seg-junction1-savanna",
      "properties": { "connects": ["junction1", "savanna"] },
      "geometry": { "type": "LineString", "coordinates": [[78.3467, 17.4335], [78.3480, 17.4340]] }
    },
    {
      "type": "Feature",
      "id": "seg-junction1-waterfall",
      "properties": { "connects": ["junction1", "waterfall"] },
      "geometry": { "type": "LineString", "coordinates": [[78.3467, 17.4335], [78.3455, 17.4350]] }
    }
  ]
}
```

Junctions (`junction1`, `junction2`, …) are trail intersections with no exhibit — just routing nodes.

Trace segments over the drone orthophoto using [geojson.io](https://geojson.io).

### Graph Traversal (BFS)

Build an adjacency graph from segments, then BFS to find the chain of segments connecting any two landmarks:

```js
function findRoute(segments, fromId, toId) {
  const graph = {};
  segments.forEach(seg => {
    const [a, b] = seg.properties.connects;
    (graph[a] = graph[a] || []).push({ node: b, seg });
    (graph[b] = graph[b] || []).push({ node: a, seg });
  });

  // BFS
  const queue = [{ node: fromId, segs: [] }];
  const visited = new Set([fromId]);
  while (queue.length) {
    const { node, segs } = queue.shift();
    if (node === toId) return segs;
    for (const { node: next, seg } of graph[node] || []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ node: next, segs: [...segs, seg] });
      }
    }
  }
  return null; // no path
}
```

### Rendering the Route

Concatenate segment coordinates into a single `LineString` and push to a dedicated Mapbox source:

```js
function showRoute(fromId, toId) {
  const segs = findRoute(trailData.features, fromId, toId);
  if (!segs) return;

  const coords = segs.flatMap((seg, i) =>
    i === 0 ? seg.geometry.coordinates : seg.geometry.coordinates.slice(1)
  );

  routeSource.setData({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords }
  });
}
```

```js
map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
map.addLayer({ id: 'trail-route', type: 'line', source: 'route',
  paint: { 'line-color': '#FF6B35', 'line-width': 4 } });

const routeSource = map.getSource('route');
```

### Mapbox Layer Setup (all segments, faintly)

```js
map.addSource('trails', { type: 'geojson', data: '/data/trails.geojson' });
map.addLayer({
  id: 'trails-default', type: 'line', source: 'trails',
  paint: { 'line-color': '#888', 'line-width': 2, 'line-opacity': 0.4 }
});
```

### Animated Dot Along Route (optional)

To pulse a dot moving along the highlighted trail, use Mapbox's `querySourceFeatures` + `turf.along` at an interval:

```js
import along from '@turf/along';
import length from '@turf/length';

function animateDot(trailFeature) {
  const totalLen = length(trailFeature);
  let dist = 0;
  const step = totalLen / 60;
  const interval = setInterval(() => {
    dist += step;
    if (dist > totalLen) { clearInterval(interval); return; }
    const pt = along(trailFeature, dist);
    dotSource.setData(pt);
  }, 100);
}
```

### Authoring Trail GeoJSON

1. Open [geojson.io](https://geojson.io)
2. Import orthophoto as a reference (or use satellite base)
3. Trace each trail segment as a `LineString`
4. Set `id` and `connects` properties per feature
5. Export → save to `experium-ai-tour-app/public/data/trails.geojson`

---

## ~~Three.js / R3F Approach~~ (Superseded)

> The original Three.js spec below is kept for reference only. It is no longer the implementation target.

## Asset Pipeline

- **Landmarks:** Blender → low-poly meshes (50-200 triangles each) → export glTF 2.0 + Draco compression
- **Quick start alternative:** Three.js built-in primitives (Box, Sphere, Cylinder, Cone) with flat shading = instant low-poly aesthetic without Blender
- **Terrain:** Single merged BufferGeometry for ground/trails (no per-mesh draw call overhead)
- **Format:** glTF 2.0 with KHR_draco_mesh_compression for file size reduction
- **AI assist for modeling:** Reference images from Midjourney → trace in Blender for faster modeling

## Technical Stack

- React Three Fiber (R3F) — declarative Three.js in React
- `@react-three/drei` — helpers (OrbitControls, Html overlays, etc.)
- Dynamic import with `ssr: false` in Next.js App Router
- `frameloop='demand'` — only re-renders on prop changes, saves mobile battery

## Architecture Sketch

```
Next.js page
└── dynamic(() => import('ParkMap3D'), { ssr: false })
    └── <Canvas frameloop="demand">
        ├── <ambientLight />
        ├── <directionalLight />
        ├── <Terrain />  (merged geometry)
        ├── <Trails />   (Line/TubeGeometry)
        ├── {exhibits.map(e => <Landmark />)}
        ├── <OrbitControls maxPolarAngle={π/3} />
        └── <CameraController />  (flyTo on QR scan)
```

## Mobile Performance

- 20-30 landmark meshes + 1 merged terrain = ~30-50 draw calls (safe zone: <1000)
- `frameloop='demand'` eliminates idle GPU usage
- Draco-compressed glTF keeps asset downloads small
- Merge terrain/vegetation into single geometry
- Target: 60fps on mid-range Android (Snapdragon 6-series)

## Interactivity

| Feature | Implementation |
|---------|---------------|
| Pan/orbit/zoom | OrbitControls |
| Tap landmark | Raycaster → onClick handler |
| Trail paths | Line geometry or TubeGeometry |
| Highlight selected | Swap material color/emissive |
| Camera fly-to | Animate camera position + target (on QR scan or tap) |
| "You are here" | GPS `watchPosition()` → project to 3D coords → blue accuracy circle on map (v1 confirmed) |
| Nearby pin highlights | Unvisited pins within 50m (max 5) get pulse animation + 1.3× scale. Category A guaranteed a slot |

## QR Tour Integration

1. Visitor scans QR at exhibit
2. Webapp opens with exhibit audio player
3. Map tab shows 3D map with camera flying to that exhibit's position
4. Tapping other landmarks from map opens their audio

## Estimated Dev Time (Solo)

| Phase | Time |
|-------|------|
| Primitives-only prototype (no Blender) | 1 week |
| Terrain + trails + basic interaction | 1 week |
| Blender models for 20-30 landmarks | 1-2 weeks |
| Polish (animations, lighting, mobile QA) | 1 week |
| **Total (with Blender)** | **3-4 weeks** |
| **Total (primitives only)** | **~2 weeks** |

## Key Libraries

- `three` — core
- `@react-three/fiber` — React renderer
- `@react-three/drei` — helpers (OrbitControls, useGLTF, Html, Line)
- `three/examples/jsm/loaders/DRACOLoader` — compressed model loading

## Open Questions

- Primitives-only for v1, or invest in Blender models upfront?
- Fixed isometric camera, or allow free orbit?
- Show trails as flat lines or elevated 3D tubes?
- ~~"You are here" via GPS — worth the complexity for v1?~~ **RESOLVED: Yes, confirmed for v1**
- Day/night mode toggle?
- Should terrain be flat-colored or have a simple texture?

## References

- [R3F performance guide](https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance)
- [Three.js optimize many objects](https://threejs.org/manual/#en/optimize-lots-of-objects)
- [GLTFLoader + Draco](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [Poly Haven](https://polyhaven.com/) — free 3D assets for reference
