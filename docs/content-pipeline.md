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

Separate from the audio pipeline. Run once per 360° photo batch.

```
[12K equirect PNG from camera] → [Resize + encode] → [Upload to Supabase Storage] → [Seed tour_nodes.tiles_url]
```

### Encoding spec

| Setting | Value | Rationale |
|---------|-------|-----------|
| Resolution | 4096×2048 | 4K — good quality on mobile, ~4.5× smaller than 12K source |
| Format | JPEG | Better compression than PNG; no transparency needed |
| Quality | 85% | Sharp enough for 360 viewer zoom; ~2.8MB per image |

### Local resize command (macOS `sips`)

```bash
sips -z 2048 4096 --setProperty format jpeg --setProperty formatOptions 85 \
  input.png --out output.jpg
```

### Upload

Upload to `panoramas/<node-label>/pano.jpg` in Supabase Storage. Copy the public URL into `tour_nodes.tiles_url` (column name is `tiles_url` to stay compatible with future v2 tile manifest upgrade).

### Estimated size (40 nodes)

40 images × ~2.8MB = **~112MB** — well within Supabase free tier (1GB).

### v2: Tile pyramid (deferred)

Storage size is nearly identical (~2.9MB/image as tiles vs 2.8MB single JPEG). The UX benefit is load time — PSV renders a 15KB preview instantly then fetches only the ~6 tiles in the current viewport (~400KB), so first render drops from 2–3s to <0.5s on mobile LTE.

Tile pyramid per image (512×512 tiles, 4K source):

| Level | Grid | Tiles | ~Size |
|-------|------|-------|-------|
| Preview | 1×1 | 1 | 15KB |
| Low (1K) | 2×1 | 2 | 50KB |
| Mid (2K) | 4×2 | 8 | 320KB |
| Full (4K) | 8×4 | 32 | 2.5MB |
| **Total** | | **43** | **~2.9MB** |

Tiling script and `EquirectangularTilesAdapter` integration tracked in issue #127.

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
