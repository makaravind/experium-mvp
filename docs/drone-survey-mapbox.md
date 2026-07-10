# Drone Survey + Mapbox Map — Experium Park

## Goal

Replace the planned Three.js illustrated map with a real drone orthophoto overlaid on Mapbox GL JS. Visitors see the actual park from above — paths, trees, water bodies, structures — with exhibit pins on top.

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
| DSM | GeoTIFF, Float32, WGS84 | Elevation model |
| Raw images | JPG with GPS EXIF | For reprocessing if needed |
| Flight log | Any format | For records |
| Processing report | PDF | GSD achieved, overlap %, coverage map |

> **Critical:** Ask operator to deliver GeoTIFF in **WGS84 (EPSG:4326)**, not UTM. If they deliver UTM, we reproject (adds a step but not a blocker).

---

## 2. Post-Processing Pipeline

Learned from Brighton Beach dataset. Run in order.

### Step 1 — Inspect the GeoTIFF
```bash
gdalinfo -mm ortho.tif
# Check: CRS, bounds, band count, min/max values
```

### Step 2 — Reproject to WGS84 (if operator delivers UTM)
```bash
gdalwarp -s_srs EPSG:326XX -t_srs EPSG:4326 -r lanczos \
  ortho_utm.tif ortho_wgs84.tif
# Replace 326XX with actual UTM zone (e.g. 32644 for Hyderabad)
```

### Step 3 — Remove white/black border (transparency)
```bash
# White border (most common with orthophoto mosaics):
nearblack -white -nb 10 -setalpha -of GTiff \
  -o ortho_alpha.tif ortho_wgs84.tif

# If border is black instead:
nearblack -nb 10 -setalpha -of GTiff \
  -o ortho_alpha.tif ortho_wgs84.tif
```

> **Why:** Orthophoto mosaics have a rotated survey footprint inside a rectangular GeoTIFF. Without this step, the padding renders as a solid white/black rectangle over the Mapbox basemap.

### Step 4 — Convert DSM to 8-bit for Mapbox upload
```bash
# Get min/max elevation first:
gdalinfo -mm dsm.tif | grep "Computed Min/Max"

# Then scale to 0-255:
gdal_translate -ot Byte -scale <min> <max> 0 255 -a_nodata 0 \
  dsm.tif dsm_8bit.tif
```

### Step 5 — Upload to Mapbox Studio
1. Go to [studio.mapbox.com/tilesets](https://studio.mapbox.com/tilesets)
2. Upload `ortho_alpha.tif` → note tileset ID (e.g. `aravindmetku.xxxxx`)
3. Upload `dsm_8bit.tif` → note tileset ID
4. Verify bounds via API:
```bash
curl "https://api.mapbox.com/v4/<tileset-id>.json?access_token=<token>" | python3 -m json.tool
```

---

## 3. App Integration

### Map tab replaces Three.js component

```
Current:  <ParkMap3D />  (Three.js/R3F)
Replace:  <ParkMapbox /> (Mapbox GL JS)
```

### Layer stack (bottom → top)

| Layer | Source | Notes |
|-------|--------|-------|
| Mapbox basemap | `mapbox://styles/mapbox/satellite-v9` | Fallback for areas outside ortho |
| Ortho RGB | `aravindmetku.xxxxx` (raster tileset) | The drone survey |
| DSM elevation | `aravindmetku.yyyyy` (raster tileset, optional) | Toggle-able, false-color |
| Exhibit pins | GeoJSON from Supabase | Tappable, open audio player |
| "You are here" | GPS `watchPosition()` | Blue dot, same as current spec |

### Exhibit pins GeoJSON shape
```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [lng, lat] },
    "properties": {
      "id": "uuid",
      "name": "Neem Tree",
      "category": "A",
      "visited": false
    }
  }]
}
```

### Mapbox version
```
mapbox-gl: v3.4.0
```

### Key paint properties
```js
// Ortho layer
'raster-opacity': 1,
'raster-resampling': 'linear'

// DSM layer (false-color elevation)
'raster-color': ['interpolate', ['linear'], ['raster-value'],
  0, '#0d0887', 64, '#7e03a8', 128, '#cc4778', 192, '#f89540', 255, '#f0f921'
],
'raster-color-range': [0, 255]
```

---

## 4. Coordinate Reference

- **Hyderabad UTM zone:** EPSG:32644 (UTM zone 44N)
- **Target CRS for all deliverables:** EPSG:4326 (WGS84)
- **Mapbox internal CRS:** EPSG:3857 (Web Mercator) — handled automatically by Mapbox

---

## 5. Tools Required

All available via `brew install gdal`:

| Tool | Purpose |
|------|---------|
| `gdalinfo` | Inspect GeoTIFF metadata, bounds, min/max |
| `gdalwarp` | Reproject CRS |
| `gdal_translate` | Convert bit depth, scale values |
| `nearblack` | Remove white/black borders, add alpha channel |

---

## 6. Open Questions

- What photogrammetry software does the operator use? (ODM, Agisoft, DJI Terra) — affects output format/quality
- Will the park provide a boundary shapefile or GPS waypoints to define the 90-acre exhibit zone?
- Timing: survey needs to happen before exhibit GPS coordinates are finalized, or after?
