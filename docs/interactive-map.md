# Interactive Park Map — Three.js / React Three Fiber

## Overview

Full 3D low-poly interactive map of Experium Park. Visitors orbit, pan, and tap landmarks to trigger audio playback. Birds-eye isometric view with camera fly-to animations on QR scan.

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
