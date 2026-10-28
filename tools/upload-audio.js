/**
 * Converts batch-1 WAV files to MP3 and uploads to Supabase Storage.
 * Run from repo root: node tools/upload-audio.js
 *
 * Prereqs:
 *   - ffmpeg in PATH
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 *     experium-ai-tour-app/.env.local
 */

import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Read .env.local
const envPath = join(ROOT, 'experium-ai-tour-app', '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(p => p.trim()))
)

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// pdf_marker → exhibit code (SMALLINT); 8b uses 8
const AUDIO_FILES = [
  { marker: '1',  code: 1 },
  { marker: '2',  code: 2 },
  { marker: '3',  code: 3 },
  { marker: '8',  code: 8 },
  { marker: '20', code: 20 },
  { marker: '24', code: 24 },
  { marker: '26', code: 26 },
  { marker: '44', code: 44 },  // Living Canopy Walk (amenity — audio still stored)
  { marker: '66', code: 66 },
  { marker: '67', code: 67 },
  { marker: '80', code: 80 },
]

const INPUT_DIR = join(__dirname, 'output')
const TMP_DIR = join(__dirname, 'output', 'mp3')
mkdirSync(TMP_DIR, { recursive: true })

for (const { marker, code } of AUDIO_FILES) {
  const wavPath = join(INPUT_DIR, `${marker}-en.wav`)
  const mp3Path = join(TMP_DIR, `${code}-en.mp3`)
  const storagePath = `${code}/en.mp3`

  // Convert WAV → MP3 (64kbps mono)
  console.log(`Converting ${marker}-en.wav → ${code}-en.mp3 ...`)
  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -b:a 64k -ac 1 "${mp3Path}"`, {
    stdio: 'pipe',
  })

  // Upload to Supabase Storage bucket 'audio'
  console.log(`Uploading to audio/${storagePath} ...`)
  const fileBuffer = readFileSync(mp3Path)
  const { error } = await supabase.storage
    .from('audio')
    .upload(storagePath, fileBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    })

  if (error) {
    console.error(`  ✗ Upload failed for ${storagePath}:`, error.message)
  } else {
    console.log(`  ✓ ${storagePath}`)
  }
}

console.log('\nDone. Now apply migration 20261028000100_batch1_audio.sql to Supabase.')
