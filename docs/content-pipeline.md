# Content Pipeline

End-to-end process from raw expert knowledge to published audio. Designed as a repeatable, AI-powered pipeline.

## Pipeline Overview

```
[Expert Interview] → [Transcription] → [Script Extraction] → [Translation] → [TTS Generation] → [Review] → [Upload & Link]
```

## Step-by-Step

### 1. Expert Interview

**Input:** Domain expert(s) + list of exhibits to cover
**Output:** Raw audio recording (1-2 sessions, 3-5 hours total for ~50 exhibits)

- Record in English
- Cover per exhibit: name, type, origin, interesting facts, significance, any stories
- No strict format needed — conversational is fine
- Record in a quiet environment (or clean up later)

### 2. Transcription

**Input:** Raw audio recording
**Output:** Full text transcript with timestamps
**Tool:** Whisper (OpenAI) or similar ASR

```bash
# Example: Whisper transcription
whisper interview.mp3 --model large --language en --output_format json
```

### 3. Script Extraction (AI)

**Input:** Full transcript
**Output:** One 60-90 second script per exhibit (150-200 words)

**Prompt pattern:**
```
Given this interview transcript about exhibits at Experium Park, extract a 
60-second audio script for [EXHIBIT NAME]. 

Requirements:
- 150-200 words (= ~60 seconds when spoken)
- Open with a brief visual identifier ("the tall tree with feathery leaves...", "the weathered stone archway...")
- Include: name, origin, 2-3 interesting facts
- For plants: include scientific name
- Tone: informative, warm, conversational (not academic)
- End with one memorable takeaway

Transcript: [...]
```

**Output format:** JSON or markdown with structured fields per exhibit.

### 4. Translation (AI)

**Input:** English scripts (all exhibits)
**Output:** Hindi + Telugu versions of each script

**Tool:** Claude / GPT-4 for translation

**Key constraints:**
- Preserve scientific/technical names in English (don't transliterate)
- Keep the same ~60 second length
- Match tone and flow of English version
- Use conversational register (not formal/literary)

### 5. TTS Generation

**Input:** Scripts in 3 languages
**Output:** Audio files (MP3, 64kbps mono)

**Tool options:**
- ElevenLabs (best quality, costs ~$0.30/1000 chars)
- Google Cloud TTS (cheaper, good quality for Indian languages)
- Azure TTS (good Hindi/Telugu support)

**Specs:**
- Format: MP3, 64kbps, mono
- Target file size: < 500KB per clip
- Voice: neutral, warm, informational (not robotic, not dramatic)
- One consistent voice per language across all exhibits

### 6. Review

**Input:** Generated audio files
**Output:** Approved audio files (or re-generation notes)

**Check for:**
- Pronunciation of names (scientific, historical, regional)
- Natural pacing (not too fast, not too slow)
- Audio quality (no glitches, no unnatural pauses)
- Factual accuracy (spot-check against transcript)
- Telugu/Hindi naturalness (get a native speaker to listen to a sample)

### 7. Upload & Link

**Input:** Approved audio files
**Output:** Live content accessible via QR codes

- Upload to S3/CDN (CloudFront)
- Register in database: `exhibit_id → {en: url, hi: url, te: url}`
- Verify: scan QR → correct audio plays in all languages

## File Naming Convention

```
audio/
  {exhibit_id}/
    en.mp3
    hi.mp3
    te.mp3
scripts/
  {exhibit_id}/
    en.md
    hi.md
    te.md
```

## Pipeline as Code

This pipeline should be implemented as a set of scripts/tools:

```
tools/
  transcribe.sh      — Whisper transcription
  extract_scripts.py — AI script extraction from transcript
  translate.py       — AI translation to target languages
  generate_tts.py    — TTS generation for all scripts
  upload.py          — Upload to S3 and register in DB
  pipeline.sh        — Runs full pipeline end-to-end
```

## Panorama Processing Pipeline (Virtual Tour)

Separate from the audio pipeline. Run once per 360° capture spot, locally from the **app repo** (`experium-ai-tour-app/`), never in CI. Spec: `docs/specs/m9a-virtual-tour-viewer.md`.

```
[12K equirect master] → tile (tile-panorama.js) → upload (same script) → seed (seed-tour-nodes.js)
```

Masters (12000×6000 PNG/JPEG, ~90 MB each) are **never committed**; keep them outside the repo (e.g. `~/Downloads/Panos`).

### Natural key: `pano_ref`

`pano_ref` is the capture-spot label from the drone-survey PDF (`1`…`40`, `37A`, `lobby` for `Front Top View`). It is the Storage folder (`panoramas/<pano_ref>/`) and the `tour_nodes` upsert key, so every step is idempotent and independent of UUIDs. Letters, digits, `-` and `_` only.

### Tiled pyramid (replaces the single-JPEG flow)

Per node, JPEG q85, 512 px tiles, cut from the master:

| File | Size | Use |
|------|------|-----|
| `manifest.json` | — | `tour_nodes.tiles_url`; `baseUrl`, `levels`, `tileUrl` pattern |
| `preview.jpg` | 1024×512 (~50 KB) | `tour_nodes.preview_url`; gallery slide, splash backdrop |
| `base.jpg` | 512×256 (~15 KB) | instant low-res while tiles stream in |
| `l0/{col}_{row}.jpg` | 1024 wide, 2×1 | |
| `l1/…` | 2048 wide, 4×2 | |
| `l2/…` | 4096 wide, 8×4 | |

≈2.9 MB / ~45 objects per node; 42 nodes ≈ 122 MB. Egress is the only risk (~3 MB per 5 nodes viewed; Supabase free tier 5 GB/month ≈ 1,500 tour sessions) — past that, Pro or R2 (only URLs are stored).

### Steps

```bash
cd experium-ai-tour-app            # needs .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# 1. tile (inspect first) — writes /tmp/tiles/<pano_ref>, uploads nothing
node tools/tile-panorama.js "<master>" <pano_ref> --dry-run

# 2. tile + upload to the public `panoramas` bucket (upsert; prints tiles_url / preview_url)
node tools/tile-panorama.js "<master>" <pano_ref>

# 3. seed tour_nodes (upsert on pano_ref; derives tiles_url / preview_url)
node tools/seed-tour-nodes.js --pano-ref <pano_ref> [--label "Name"] [--lobby] [--lat N --lng N] --dry-run
node tools/seed-tour-nodes.js --pano-ref <pano_ref> [--label "Name"] [--lobby] [--lat N --lng N]
```

m9a defaults — lobby (`Front Top View` → `pano_ref=lobby`, `is_lobby=true`, label "Park Entrance", lat/lng at the gate) and node `1` (label "Node 1"):

```bash
node tools/seed-tour-nodes.js --lat <gate_lat> --lng <gate_lng> --dry-run   # review rows
node tools/seed-tour-nodes.js --lat <gate_lat> --lng <gate_lng>
```

- Label defaults to `Node <pano_ref>`; rename later (`/admin/tour`, m9b). Re-seeding resets the label.
- `lat`/`lng` are only written when passed, so coordinates placed in `/admin/tour` survive a re-seed.
- Re-tiling at a higher top-level resolution later is just a re-run of step 2; `tiles_url` does not change.
- Prereqs: `tour_nodes` migration and the `panoramas` bucket must exist (m9a step 2).

---

## Updating Content

Same pipeline, just re-run from the changed step:
- Fact correction → edit script → re-translate → re-generate TTS → re-upload
- New language → translate existing scripts → generate TTS → upload
- New exhibit → mini-interview or desk research → full pipeline for that one exhibit

## Estimated Timeline (~50 exhibits)

| Step | Time |
|------|------|
| Expert interview | 1-2 days (scheduling + recording) |
| Transcription | 1 hour (automated) |
| Script extraction | 2-3 hours (AI + review) |
| Translation | 1-2 hours (AI + spot-check) |
| TTS generation | 1-2 hours (automated) |
| Review | 1 day (listen through samples) |
| Upload + link | 1 hour (automated) |
| **Total** | **3-5 days** |
