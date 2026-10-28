/**
 * Applies batch-1 migrations via supabase CLI, then converts + uploads audio.
 * Usage: node tools/run-migrations.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const APP = join(ROOT, 'experium-ai-tour-app')

// Read .env.local
const envRaw = readFileSync(join(APP, '.env.local'), 'utf8')
const env = Object.fromEntries(
  envRaw
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']
const DB_PASSWORD = process.env.PGPASSWORD

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}
if (!DB_PASSWORD) {
  console.error('Missing PGPASSWORD env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const db = new Client({
  host: 'db.oslmbxefuqbkgqrnfcvm.supabase.co',
  port: 5432, database: 'postgres', user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

const MIGRATIONS_DIR = join(APP, 'supabase', 'migrations')

async function applyMigration(filename) {
  const sql = readFileSync(join(MIGRATIONS_DIR, filename), 'utf8')
  console.log(`\n▶ ${filename}`)
  await db.query(sql)
  console.log(`  ✓ Applied`)
}

// Audio: pdf_marker → exhibit code
const AUDIO_FILES = [
  { marker: '1',  code: 1 },
  { marker: '2',  code: 2 },
  { marker: '3',  code: 3 },
  { marker: '8',  code: 8 },
  { marker: '20', code: 20 },
  { marker: '24', code: 24 },
  { marker: '26', code: 26 },
  { marker: '44', code: 44 },
  { marker: '66', code: 66 },
  { marker: '67', code: 67 },
  { marker: '80', code: 80 },
]

const INPUT_DIR = join(__dirname, 'output')
const MP3_DIR = join(__dirname, 'output', 'mp3')
mkdirSync(MP3_DIR, { recursive: true })

async function uploadAudio() {
  console.log('\n▶ Converting + uploading audio')
  for (const { marker, code } of AUDIO_FILES) {
    const wavPath = join(INPUT_DIR, `${marker}-en.wav`)
    const mp3Path = join(MP3_DIR, `${code}-en.mp3`)
    const storagePath = `${code}/en.mp3`

    process.stdout.write(`  [${code}] convert... `)
    execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -b:a 64k -ac 1 "${mp3Path}" 2>/dev/null`)

    process.stdout.write(`upload... `)
    const fileBuffer = readFileSync(mp3Path)
    const { error } = await supabase.storage
      .from('audio')
      .upload(storagePath, fileBuffer, { contentType: 'audio/mpeg', upsert: true })

    if (error) console.log(`✗ ${error.message}`)
    else console.log(`✓`)
  }
}

await db.connect()
console.log('Connected to Supabase DB')

await uploadAudio()
await applyMigration('20261028000100_batch1_audio.sql')

await db.end()
console.log('\n✅ All done.')
