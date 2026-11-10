/**
 * Seeds sections + exhibit section/number from a marker-placer export.
 * - upserts sections
 * - existing exhibits: matched to the nearest marker by GPS (<= 5 m) → section + number
 * - markers with no matching exhibit: placeholder exhibit (coming_soon), code = max(code)+1
 * Idempotent: markers whose (section, number) already exists are skipped.
 * Usage: node tools/seed-sections.js <markers.json> [--apply]   (dry-run without --apply)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const APP = join(__dirname, '..', 'experium-ai-tour-app')
const MATCH_METERS = 5

const [file, flag] = process.argv.slice(2)
if (!file) {
  console.error('Usage: node tools/seed-sections.js <markers.json> [--apply]')
  process.exit(1)
}
const apply = flag === '--apply'

const env = Object.fromEntries(
  readFileSync(join(APP, '.env.local'), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'], {
  auth: { persistSession: false },
})

const { sections, markers } = JSON.parse(readFileSync(file, 'utf8'))

const meters = (a, b) =>
  Math.hypot((a.lat - b.lat) * 111000, (a.lng - b.lng) * 111000 * Math.cos((a.lat * Math.PI) / 180))

const { data: exhibits, error } = await supabase.from('exhibits').select('*').order('code')
if (error) throw error

const taken = new Set(exhibits.filter(e => e.section).map(e => `${e.section}${e.number}`))
const used = new Set()
const updates = []
const inserts = []

for (const e of exhibits) {
  if (e.section) continue
  const here = { lat: e.gps_lat, lng: e.gps_lng }
  const m = markers
    .filter(m => !used.has(m.id) && !taken.has(m.id))
    .map(m => ({ m, d: meters(here, m) }))
    .sort((a, b) => a.d - b.d)[0]
  if (!m || m.d > MATCH_METERS) {
    console.log(`! no marker within ${MATCH_METERS} m for code ${e.code} ${e.name}`)
    continue
  }
  used.add(m.m.id)
  updates.push({ id: e.id, section: m.m.section, number: m.m.number })
  console.log(`exhibit ${e.code} ${e.name} → ${m.m.id} (${m.d.toFixed(1)} m)`)
}

let nextCode = Math.max(0, ...exhibits.map(e => Number(e.code))) + 1
const sorted = [...markers].sort((a, b) => a.section.localeCompare(b.section) || a.number - b.number)
for (const m of sorted) {
  if (used.has(m.id) || taken.has(m.id)) continue
  inserts.push({
    code: nextCode++,
    name: `Exhibit ${m.id}`,
    type: 'landmark',
    tier: 'bronze',
    status: 'coming_soon',
    gps_lat: m.lat,
    gps_lng: m.lng,
    section: m.section,
    number: m.number,
  })
}
console.log(`\n${sections.length} sections, ${updates.length} exhibit updates, ${inserts.length} placeholder inserts`)

if (!apply) {
  console.log('Dry run. Re-run with --apply to write.')
  process.exit(0)
}

const { error: sErr } = await supabase.from('sections').upsert(sections, { onConflict: 'id' })
if (sErr) throw sErr
for (const u of updates) {
  const { error: uErr } = await supabase.from('exhibits').update({ section: u.section, number: u.number }).eq('id', u.id)
  if (uErr) throw uErr
}
if (inserts.length) {
  const { error: iErr } = await supabase.from('exhibits').insert(inserts)
  if (iErr) throw iErr
}
console.log('Seeded.')
