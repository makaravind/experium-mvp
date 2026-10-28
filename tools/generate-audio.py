#!/usr/bin/env python3.11
"""
Generate audio from exhibit scripts in the Experium CSV.

Usage:
  python3.11 generate-audio.py --csv <path> --all
  python3.11 generate-audio.py --csv <path> --exhibits 1,3,5
  python3.11 generate-audio.py --csv <path> --list
"""

import argparse
import csv
import os
import re
import subprocess
import sys
import tempfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "output")
MODELS_DIR = os.path.join(SCRIPT_DIR, "models")
MODEL_FILE = os.path.join(MODELS_DIR, "kokoro-v1.0.onnx")
VOICES_FILE = os.path.join(MODELS_DIR, "voices-v1.0.bin")

# Pronunciation overrides for brand names, foreign words, or tricky terms.
# Kokoro uses espeak-ng phonemization, so phonetic respellings work best.
# For true IPA, wrap in /.../ — support depends on your kokoro-tts build.
# Examples:
#   "Experium": "Eks-peer-ee-um"
#   "Baobab": "BAY-oh-bab"
PRONUNCIATION_DICT: dict[str, str] = {}


def strip_markdown(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)   # bold
    text = re.sub(r"__(.+?)__", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)         # italic
    text = re.sub(r"_(.+?)_", r"\1", text)
    text = re.sub(r"#{1,6}\s*", "", text)             # headings
    text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)  # markdown links
    text = re.sub(r"`(.+?)`", r"\1", text)            # inline code
    text = re.sub(r"\[.*?\]", "", text)               # stage cues [beat], [pause]
    return text.strip()


def normalize_currency(text: str) -> str:
    # ₹ 85 lakhs → "85 lakh rupees"  (natural Indian spoken order)
    text = re.sub(
        r"₹\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|crore|crores)",
        lambda m: f"{m.group(1)} {m.group(2).rstrip('s')} rupees",
        text, flags=re.IGNORECASE,
    )
    # bare ₹ X → "X rupees"
    text = re.sub(r"₹\s*(\d[\d,]*(?:\.\d+)?)", r"\1 rupees", text)
    return text


def normalize_numbers(text: str) -> str:
    # Remove thousands-separator commas inside numbers (Kokoro reads "," as a pause)
    # e.g. 1,000 → 1000 ; 8,50,000 → 850000
    text = re.sub(r"(\d),(\d)", r"\1\2", text)
    # Retry for Indian triple-grouping (8,50,000 needs two passes)
    text = re.sub(r"(\d),(\d)", r"\1\2", text)
    return text


def apply_pronunciation_dict(text: str) -> str:
    for word, phonetic in PRONUNCIATION_DICT.items():
        text = re.sub(r"\b" + re.escape(word) + r"\b", phonetic, text, flags=re.IGNORECASE)
    return text


def normalize_script(script: str) -> str:
    """Clean and normalise script text before feeding to kokoro-tts."""
    script = strip_markdown(script)
    script = normalize_currency(script)
    script = normalize_numbers(script)
    script = apply_pronunciation_dict(script)
    # Collapse excess whitespace
    script = re.sub(r"[ \t]+", " ", script)
    script = re.sub(r"\n{3,}", "\n\n", script)
    return script.strip()


def to_tts_text(script: str) -> str:
    """One sentence per paragraph so Kokoro inserts a natural pause between sentences."""
    script = normalize_script(script)
    sentences = re.split(r"(?<=[.!?])\s+", script)
    return "\n\n".join(s for s in sentences if s)


DEFAULT_VOICE = "af_bella"
DEFAULT_SPEED = "0.85"
LANG = "en-us"


def check_models():
    missing = []
    if not os.path.exists(MODEL_FILE):
        missing.append("kokoro-v1.0.onnx")
    if not os.path.exists(VOICES_FILE):
        missing.append("voices-v1.0.bin")
    if missing:
        print("Missing model files. Download them into tools/models/:\n")
        print(f"  mkdir -p {MODELS_DIR}")
        print(f"  wget -P {MODELS_DIR} https://github.com/nazdridoy/kokoro-tts/releases/download/v1.0.0/kokoro-v1.0.onnx")
        print(f"  wget -P {MODELS_DIR} https://github.com/nazdridoy/kokoro-tts/releases/download/v1.0.0/voices-v1.0.bin")
        sys.exit(1)


def load_exhibits(csv_path):
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)

    # Row 0: descriptions, Row 1: headers, Row 2+: data
    headers = rows[1]
    data = rows[2:]

    col = {h: i for i, h in enumerate(headers)}
    name_col = col.get("Reference Name", 1)
    marker_col = col.get("pdf marker", 2)
    script_col = next((i for i, h in enumerate(headers) if "Audio script (EN)" in h), 11)

    exhibits = []
    for row in data:
        if len(row) <= script_col:
            continue
        marker = row[marker_col].strip()
        name = row[name_col].strip()
        script = row[script_col].strip()
        if not marker or not script:
            continue
        exhibits.append({"code": marker, "name": name, "script": script})
    return exhibits


def generate(exhibit, voice, speed):
    code = exhibit["code"]
    out_file = os.path.join(OUTPUT_DIR, f"{code}-en.wav")

    if os.path.exists(out_file):
        print(f"  [{code}] skip — {os.path.basename(out_file)} already exists")
        return

    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as tmp:
        tmp.write(to_tts_text(exhibit["script"]))
        tmp_path = tmp.name

    try:
        print(f"  [{code}] {exhibit['name']} → generating...")
        result = subprocess.run(
            [
                "kokoro-tts", tmp_path, out_file,
                "--lang", LANG,
                "--voice", voice,
                "--speed", speed,
                "--model", MODEL_FILE,
                "--voices", VOICES_FILE,
            ],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"  [{code}] ERROR: {result.stderr.strip()}")
        else:
            print(f"  [{code}] done → {out_file}")
    finally:
        os.unlink(tmp_path)


def main():
    parser = argparse.ArgumentParser(description="Generate exhibit audio from CSV")
    parser.add_argument("--csv", required=True, help="Path to the Experium CSV file")
    parser.add_argument("--all", action="store_true", help="Generate audio for all exhibits")
    parser.add_argument("--exhibits", help="Comma-separated pdf marker codes, e.g. 1,3,5")
    parser.add_argument("--list", action="store_true", help="List all exhibits and exit")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"Voice (default: {DEFAULT_VOICE})")
    parser.add_argument("--speed", default=DEFAULT_SPEED, help=f"Speech speed (default: {DEFAULT_SPEED})")
    args = parser.parse_args()

    if not args.csv or not os.path.exists(args.csv):
        print(f"CSV not found: {args.csv}")
        sys.exit(1)

    exhibits = load_exhibits(args.csv)

    if args.list:
        print(f"{'Code':<6}  Name")
        print("-" * 40)
        for e in exhibits:
            has_script = "✓" if e["script"] else "✗"
            print(f"  {e['code']:<4}  {e['name']}  [{has_script}]")
        return

    if not args.all and not args.exhibits:
        parser.print_help()
        sys.exit(1)

    check_models()
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if args.all:
        selected = exhibits
    else:
        codes = {c.strip() for c in args.exhibits.split(",")}
        selected = [e for e in exhibits if e["code"] in codes]
        missing = codes - {e["code"] for e in selected}
        if missing:
            print(f"Warning: codes not found in CSV: {', '.join(missing)}")

    print(f"Generating {len(selected)} exhibit(s) — voice: {args.voice}, speed: {args.speed}\n")
    for exhibit in selected:
        generate(exhibit, args.voice, args.speed)
    print("\nDone.")


if __name__ == "__main__":
    main()
