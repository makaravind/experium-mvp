---
description: Generate EN audio (WAV + MP3) from an inline exhibit script
argument-hint: <script text>
---

Convert the script in `$ARGUMENTS` to audio with Kokoro TTS. English only. Stops after generating; upload is separate (`tools/upload-audio.js`).

All paths relative to the repo root (`experium-qr-code/`; the session may start in `experium-ai-tour-app/`, so use `../tools/…` or absolute paths).

## Steps

1. **Validate.** If `$ARGUMENTS` is empty, ask for the script. If it contains non-Latin characters (e.g. Devanagari), stop: "EN only, Hindi/Telugu TTS is deferred."
2. **Marker.** If the script doesn't carry one, ask with `AskUserQuestion` for the pdf marker (e.g. `24`). Don't ask about language, voice, or speed — defaults only.
3. **Overwrite.** If `tools/output/{marker}-en.wav` exists, ask before overwriting. Pass `--force` only on yes.
4. **Generate.** Write the script text to a temp file (outside the repo), then:
   ```
   python3.11 tools/generate-audio.py --text-file <tmp> --marker <marker> [--force]
   ```
   Default voice `af_bella`, speed `0.85`. Delete the temp file after.
5. **MP3.** Same flags as `tools/upload-audio.js`:
   ```
   mkdir -p tools/output/mp3
   ffmpeg -y -i tools/output/{marker}-en.wav -codec:a libmp3lame -b:a 64k -ac 1 tools/output/mp3/{marker}-en.mp3
   ```
6. **Report**, concisely: WAV + MP3 paths, duration (`ffprobe -v error -show_entries format=duration -of csv=p=0`), MP3 size, word count. Warn (don't block) if duration > 90s or MP3 > 500KB.
7. **Flag tricky terms.** List terms Kokoro may mispronounce: Latin binomials, non-English proper nouns, brand names. Tell the user: reply "say X as Y" to fix.
8. **Pronunciation fix.** On "say X as Y": add `"X": "Y"` (phonetic respelling) to `PRONUNCIATION_DICT` in `tools/generate-audio.py`, then redo steps 4–6 with `--force`. The dict is permanent, so later exhibits benefit.

## Don't

- Don't upload, touch Supabase, or commit.
- Don't edit or trim the user's script.
