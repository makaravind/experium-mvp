# GeoTIFF → PMTiles Pipeline

How to regenerate `park.pmtiles` from a drone orthophoto GeoTIFF.

Run this when: new drone survey delivered, tile quality needs updating, or park boundary expands.

Output goes to: `experium-ai-tour-app/public/park.pmtiles`

---

## Prerequisites

```bash
brew install gdal          # gdalinfo, gdalwarp, nearblack, gdal2tiles
pip install gdal2tiles     # if gdal2tiles.py not on PATH after brew install
npm install -g pmtiles     # pmtiles CLI
```

Verify:
```bash
gdalinfo --version         # GDAL 3.x
gdal2tiles.py --version
pmtiles --version
```

---

## Step 1 — Inspect the GeoTIFF

```bash
gdalinfo -mm ortho.tif
```

Check:
- **CRS** — must be `EPSG:4326` (WGS84). If UTM, go to Step 2. If already WGS84, skip.
- **Bounds** — should cover park area ~`[78.457, 17.934, 78.466, 17.941]`
- **Band count** — 3 (RGB) or 4 (RGBA)

---

## Step 2 — Reproject to WGS84 (skip if already EPSG:4326)

Hyderabad is UTM zone 44N (`EPSG:32644`):

```bash
gdalwarp -s_srs EPSG:32644 -t_srs EPSG:4326 -r lanczos \
  ortho_utm.tif ortho_wgs84.tif
```

---

## Step 3 — Remove border padding (transparency)

Drone orthophoto mosaics have a rotated footprint inside a rectangular GeoTIFF. Without this step the padding renders as a solid white rectangle.

```bash
# White border (most common):
nearblack -white -nb 10 -setalpha -of GTiff \
  -o ortho_alpha.tif ortho_wgs84.tif

# Black border instead:
nearblack -nb 10 -setalpha -of GTiff \
  -o ortho_alpha.tif ortho_wgs84.tif
```

---

## Step 4 — Generate XYZ raster tiles

Zoom 14–19 covers the full park at walking resolution. Tile size 256 matches the app's `tileSize: 256` in the MapLibre source config.

```bash
gdal2tiles.py \
  --zoom=14-19 \
  --tilesize=256 \
  --resampling=lanczos \
  --webviewer=none \
  --processes=4 \
  ortho_alpha.tif \
  tiles/
```

This produces a `tiles/` directory with the layout `tiles/{z}/{x}/{y}.png`. Zoom 19 is the highest — expect ~150–300 MB of PNGs for an 11 km² park.

---

## Step 5 — Bundle into PMTiles

```bash
pmtiles convert tiles/ park.pmtiles
```

Verify size and inspect metadata:
```bash
ls -lh park.pmtiles              # expect ~10–15 MB after PNG compression
pmtiles show park.pmtiles        # prints bounds, zoom range, format
pmtiles verify park.pmtiles      # checks internal index integrity
```

Expected output from `pmtiles show`:
```
format: png
bounds: 78.45778,17.93478,78.46515,17.94059
minzoom: 14
maxzoom: 19
```

---

## Step 6 — Copy to app and deploy

```bash
cp park.pmtiles \
  /path/to/experium-ai-tour-app/public/park.pmtiles
```

Commit and deploy — the service worker (m5) precaches `/park.pmtiles` automatically on next deploy.

```bash
cd experium-ai-tour-app
git add public/park.pmtiles
git commit -m "chore: update park.pmtiles from <date> drone survey"
```

---

## Smoke-test

Serve the POC locally to verify the tiles look correct before committing:

```bash
cd sample-map/pmtiles-poc
python3 serve.py          # serves on http://localhost:8080
```

Open in browser — park ortho should render at zoom 17–19 with no white borders or missing tiles.

---

## Park bounds reference

Used in `maxBounds` and `fitBounds` throughout the app:

| | Lng | Lat |
|--|-----|-----|
| SW | 78.45778 | 17.93478 |
| NE | 78.46515 | 17.94059 |

Center: `[78.46147, 17.93769]`

---

## Troubleshooting

**White/black tiles at park edges** — border removal in Step 3 was insufficient. Re-run `nearblack` with `-nb 20`.

**`pmtiles show` reports wrong bounds** — GeoTIFF was in UTM, reproject first (Step 2).

**File too large (>20 MB)** — reduce max zoom to 18, or switch resampling to `average` instead of `lanczos`.

**`gdal2tiles.py` slow** — increase `--processes` (use `nproc` to find CPU count).
