# Content Pipeline

End-to-end process from raw expert knowledge to published audio. Designed as a repeatable, AI-powered pipeline.

## Pipeline Overview

```
[Expert Interview] → [Transcription] → [Script Extraction] → [Translation] → [TTS Generation] → [Review] → [Upload & Link]
```

## Step-by-Step

### 1. Expert Interview

**Input:** Botanist/domain expert + list of plants to cover
**Output:** Raw audio recording (1-2 sessions, 3-5 hours total for 50 plants)

- Record in English
- Cover per plant: name, species, origin, interesting facts, significance, any stories
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
**Output:** One 60-90 second script per plant (150-200 words)

**Prompt pattern:**
```
Given this interview transcript about plants at Experium Park, extract a 
60-second audio script for [PLANT NAME]. 

Requirements:
- 150-200 words (= ~60 seconds when spoken)
- Open with a brief visual identifier ("the tall tree with feathery leaves...")
- Include: common name, scientific name, origin, 2-3 interesting facts
- Tone: informative, warm, conversational (not academic)
- End with one memorable takeaway

Transcript: [...]
```

**Output format:** JSON or markdown with structured fields per plant.

### 4. Translation (AI)

**Input:** English scripts (all plants)
**Output:** Hindi + Telugu versions of each script

**Tool:** Claude / GPT-4 for translation

**Key constraints:**
- Preserve botanical/scientific names in English (don't transliterate)
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
- One consistent voice per language across all plants

### 6. Review

**Input:** Generated audio files
**Output:** Approved audio files (or re-generation notes)

**Check for:**
- Pronunciation of botanical names
- Natural pacing (not too fast, not too slow)
- Audio quality (no glitches, no unnatural pauses)
- Factual accuracy (spot-check against transcript)
- Telugu/Hindi naturalness (get a native speaker to listen to a sample)

### 7. Upload & Link

**Input:** Approved audio files
**Output:** Live content accessible via QR codes

- Upload to S3/CDN (CloudFront)
- Register in database: `plant_id → {en: url, hi: url, te: url}`
- Verify: scan QR → correct audio plays in all languages

## File Naming Convention

```
audio/
  {plant_id}/
    en.mp3
    hi.mp3
    te.mp3
scripts/
  {plant_id}/
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

## Updating Content

Same pipeline, just re-run from the changed step:
- Fact correction → edit script → re-translate → re-generate TTS → re-upload
- New language → translate existing scripts → generate TTS → upload
- New plant → mini-interview or desk research → full pipeline for that one plant

## Estimated Timeline (50 plants)

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
