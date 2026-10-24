# Drone Survey → PMTiles Pipeline — Experium Park

## Goal

Replace the stub `public/park.pmtiles` with a real drone orthophoto. The app uses **MapLibre GL + PMTiles** — no Mapbox account needed.

---

## 1. Flight Brief (give this to the operator)

### Coverage
- **Area:** Exhibit zone only — approximately 90 acres (~36 hectares)
- **Do not** need to cover the full 150-acre property

### Flight Parameters

| Parameter | Spec |
|-----------|------|
| Flight pattern | **North-aligned grid** (rows parallel to north — no diagonal passes) |
| Altitude | 80–100m AGL |
| GSD (resolution) | 10–15cm per pixel |
| Front overlap | 80% |
| Side overlap | 70% |
| Camera angle | **Nadir only** (straight down — no oblique passes needed) |
| Flight passes | Single flight sufficient at 80–100m |

> **Why north-aligned grid:** Diagonal flight patterns produce rotated GeoTIFFs with large transparent borders that complicate tiling. North-aligned output is a clean rectangle.

### Site Notes
- Mostly open parkland with large trees and some structures
- No special oblique passes required for structures
- Operator handles DGCA airspace clearance

### Deliverables Required

| File | Format | Notes |
|------|--------|-------|
| Orthophoto | GeoTIFF, RGB, WGS84 (EPSG:4326) | Primary deliverable |
| DSM | GeoTIFF, Float32, WGS84 | Elevation model (for records only) |
| Raw images | JPG with GPS EXIF | For reprocessing if needed |
| Flight log | Any format | For records |
| Processing report | PDF | GSD achieved, overlap %, coverage map |

> **Critical:** Ask operator to deliver GeoTIFF in **WGS84 (EPSG:4326)**, not UTM. If they deliver UTM, we reproject (adds a step but not a blocker).

---

## 2. Post-Processing Pipeline

Run in order.

### Step 1 — Inspect the GeoTIFF
```bash
gdalinfo -mm ortho.tif
# Check: CRS, bounds, band count, min/max values
# Note the bounds — you'll need them in Step 6
```

### Step 2 — Reproject to WGS84 (if operator delivers UTM)
```bash
gdalwarp -s_srs EPSG:32644 -t_srs EPSG:4326 -r lanczos \
  ortho_utm.tif ortho_wgs84.tif
# 32644 = UTM zone 44N (Hyderabad). Adjust if different zone.
```

### Step 3 — Skip nearblack (3Dnovator output already has alpha)
The 3Dnovator orthomosaic includes Band 4 (Alpha) — the transparent border is already encoded.
Skip nearblack entirely; use `ortho_wgs84.tif` directly in Step 4.

> If a future operator delivers a 3-band RGB with white/black borders instead, add nearblack here.

### Step 4 — Downsample to z20 then convert to MBTiles
The 3Dnovator output is ~3.6cm GSD → native z22. `gdal_translate` ignores `ZOOM_LEVEL` as a
creation option, so downsample first, then translate.

```bash
# Check source pixel count:
gdalinfo ortho_wgs84.tif | grep "Size is"
# e.g. "Size is 27212, 16405" → divide by 2 for z21 → 13606 x 8203

gdalwarp -ts 13606 8203 -r lanczos \
  ortho_wgs84.tif ortho_z21.tif

gdal_translate -of MBTiles \
  -co TILE_FORMAT=WEBP \
  -co ZOOM_LEVEL_STRATEGY=UPPER \
  ortho_z21.tif ortho.mbtiles

# Add z15–z20 overviews:
gdaladdo -r average ortho.mbtiles 2 4 8 16 32 64

# Verify zoom range:
gdalinfo ortho.mbtiles | grep -i zoom
# Expect minzoom=15, maxzoom=21 (park is too small for a z14 tile)
# Output PMTiles: ~17MB
```

### Step 5 — Convert MBTiles → PMTiles
```bash
# Install: brew install pmtiles  (or pip install pmtiles)
pmtiles convert ortho.mbtiles park.pmtiles

# Inspect the result:
pmtiles show park.pmtiles
# Note: bounds printed here — cross-check against gdalinfo output
```

### Step 6 — Update app constants
Open `components/map/ParkMap.tsx` and update `ORTHO_BOUNDS` with the actual survey bounds from Step 1.
Also update `minzoom` in the map source config and `minZoom` on the Map constructor to match the generated
pyramid (currently z15 for this survey).

Current values (Experium Park, Oct 2026 survey):
```ts
const ORTHO_BOUNDS: [number, number, number, number] = [
  78.187123, 17.378546, 78.196134, 17.383978,
]
// In the Map source config and constructor:
minzoom: 15,
maxzoom: 21,
```

`STARTING_CENTER` and `MAX_BOUNDS` are derived from `ORTHO_BOUNDS` — no separate update needed.
Also update the `HIT_CIRCLE_RADIUS_MIN` constant and the circle layer interpolation stop from 14 → 15.

### Step 7 — Replace the file
```bash
cp park.pmtiles <repo>/experium-ai-tour-app/public/park.pmtiles
```

The service worker (`app/sw.ts`) fetches and caches the full PMTiles file on first visit — no other config needed.

---

## 3. App Integration Reference

The map component (`components/map/ParkMap.tsx`) loads the file as:

```ts
sources: {
  park: {
    type: 'raster',
    url: 'pmtiles:///park.pmtiles',  // served from /public
    tileSize: 256,
    minzoom: 14,
    maxzoom: 20,
  },
},
layers: [
  { id: 'bg', type: 'background', paint: { 'background-color': '#0f172a' } },
  { id: 'park', type: 'raster', source: 'park' },
  // exhibit pins and amenity markers added on map.on('load')
],
```

The PMTiles protocol is registered via the `pmtiles` npm package — no Mapbox token required.

---

## 4. Coordinate Reference

- **Hyderabad UTM zone:** EPSG:32644 (UTM zone 44N)
- **Target CRS for all deliverables:** EPSG:4326 (WGS84)
- **MapLibre internal CRS:** EPSG:3857 (Web Mercator) — handled automatically

---

## 5. Tools Required

All available via `brew install gdal pmtiles`:

| Tool | Purpose |
|------|---------|
| `gdalinfo` | Inspect GeoTIFF metadata, bounds, min/max |
| `gdalwarp` | Reproject CRS |
| `nearblack` | Remove white/black borders, add alpha channel |
| `gdal_translate` | Convert GeoTIFF → MBTiles |
| `pmtiles` | Convert MBTiles → PMTiles, inspect output |

---

## 6. Open Questions

- What photogrammetry software does the operator use? (ODM, Agisoft, DJI Terra) — affects output format/quality
- Will the park provide a boundary shapefile or GPS waypoints to define the 90-acre exhibit zone?
- Timing: survey needs to happen before exhibit GPS coordinates are finalized, or after?
