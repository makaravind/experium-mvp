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
import subprocess
import sys
import tempfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "output")
MODELS_DIR = os.path.join(SCRIPT_DIR, "models")
MODEL_FILE = os.path.join(MODELS_DIR, "kokoro-v1.0.onnx")
VOICES_FILE = os.path.join(MODELS_DIR, "voices-v1.0.bin")

DEFAULT_VOICE = "af_bella"
DEFAULT_SPEED = "1.0"
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
        tmp.write(exhibit["script"])
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
