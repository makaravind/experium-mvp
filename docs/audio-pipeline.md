# Audio Generation Pipeline

End-to-end process for producing exhibit audio — from on-site voice capture to WAV files ready for upload.

```
[Voice recording on site]
       ↓
[Gemini Gem → structured notes]
       ↓
[/experium-transcript → facts + script]
       ↓
[kokoro-tts → WAV file]
```

---

## Step 1 — Capture founder notes (on site)

Record a voice memo on your phone while standing at each exhibit. No script needed — talk through:

- What it is, where it's from
- What makes it rare or significant
- Any stories, costs, construction details, or visitor observations
- What you want visitors to feel or remember

One recording can cover multiple exhibits if done in sequence. Aim for 2–5 minutes per exhibit.

---

## Step 2 — Transcribe with Gemini Gem

Use the **Experium Structured Notes** Gemini Gem to convert the raw recording into structured exhibit notes.

- Upload the voice memo directly to the Gem
- It extracts: entity name, botanical/material specs, origin, physical characteristics, financial/operational data, maintenance notes, and a signage-ready info panel copy
- Output is pasted into the **Founder notes** column of the Experium Data Completion CSV (`pdf marker`, `Reference Name`, `Founder notes` columns)

---

## Step 3 — Script extraction with `/experium-transcript`

Run the Claude skill `/experium-transcript` on the structured notes from Step 2.

The skill converts raw structured notes into two outputs per exhibit:
- **Facts** — short, concrete bullet points (shown on the exhibit card)
- **Audio script (EN) 45s** — a ~45 second narration script, written for spoken delivery

Paste the outputs into the corresponding columns in the CSV.

---

## Step 4 — Generate audio locally with kokoro-tts

### Prerequisites

**Python 3.11** (required — kokoro-tts does not support Python 3.13+):
```bash
# Check
python3.11 --version

# Install kokoro-tts
python3.11 -m pip install kokoro-tts
```

**Model files** — download once into `tools/models/`:
```bash
mkdir -p tools/models
curl -L -o tools/models/kokoro-v1.0.onnx \
  https://github.com/nazdridoy/kokoro-tts/releases/download/v1.0.0/kokoro-v1.0.onnx
curl -L -o tools/models/voices-v1.0.bin \
  https://github.com/nazdridoy/kokoro-tts/releases/download/v1.0.0/voices-v1.0.bin
```

File sizes: `kokoro-v1.0.onnx` ~310 MB, `voices-v1.0.bin` ~25 MB. Download takes a few minutes.

### Running the script

```bash
# List all exhibits and their codes
python3.11 tools/generate-audio.py --csv "path/to/csv" --list

# Generate all exhibits
python3.11 tools/generate-audio.py --csv "path/to/csv" --all

# Generate specific exhibits (by pdf marker code)
python3.11 tools/generate-audio.py --csv "path/to/csv" --exhibits 1,3,20

# Override voice or speed
python3.11 tools/generate-audio.py --csv "path/to/csv" --all --voice af_nova --speed 1.0
```

Output files land in `tools/output/` as `{pdf_marker}-en.wav`.

### Current configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| Engine | kokoro-tts 2.3.2 | Local ONNX inference, no API key |
| Model | kokoro-v1.0.onnx | ~310 MB |
| Voice | `af_bella` | American English female |
| Speed | `0.95` | Slightly slower than default for clarity |
| Language | `en-us` | |
| Format | WAV | ~1.5–2 MB per exhibit |

### Script pre-processing

Before passing text to kokoro-tts, `generate-audio.py` normalises the script:

- **Markdown stripped** — removes `**bold**`, `_italic_`, headings, `[stage cues]`
- **Currency normalised** — `₹ 85 lakhs` → `85 lakh rupees` (natural spoken order)
- **Number commas removed** — `1,00,000` → `100000` (kokoro reads `,` as a pause)
- **Sentence-per-paragraph** — each sentence on its own line so kokoro inserts natural pauses between them
- **Pronunciation dict** — `PRONUNCIATION_DICT` in the script for overriding tricky terms (currently empty; add entries as needed)

### Available voices (English)

| Prefix | Accent |
|--------|--------|
| `af_*` | American female |
| `am_*` | American male |
| `bf_*` | British female |
| `bm_*` | British male |

Full list: `kokoro-tts --help-voices --model tools/models/kokoro-v1.0.onnx --voices tools/models/voices-v1.0.bin`

### Re-generating an exhibit

The script skips files that already exist. To re-generate:
```bash
rm tools/output/{code}-en.wav
python3.11 tools/generate-audio.py --csv "path/to/csv" --exhibits {code}
```

---

## CSV → DB column mapping

| CSV column | DB table | DB column |
|---|---|---|
| `pdf marker` | `exhibits` | `code` (SMALLINT 1–99) |
| `Reference Name` | `exhibits` | `name` |
| `type` | `exhibits` | `type` |
| `tier` | `exhibits` | `tier` |
| `Lat` / `Lng` | `exhibits` | `gps_lat` / `gps_lng` |
| `facts` | `exhibits` | `facts` (JSONB) |
| `Audio script (EN) 45s` | `exhibit_audio` | `script` (language = `en`) |

Audio files upload to Supabase Storage; the resulting URL goes into `exhibit_audio.audio_url`.
