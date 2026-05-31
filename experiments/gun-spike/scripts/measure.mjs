// Measure built bundle sizes and write a summary into REPORT.md.
// Run via `pnpm report` after `pnpm build`.

import { readdir, stat, readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(ROOT, 'dist', 'assets')

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const out = []
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(full)))
    else out.push(full)
  }
  return out
}

function fmt(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

const files = await walk(DIST)
const rows = []
let totalRaw = 0
let totalGz = 0

for (const f of files) {
  if (!f.endsWith('.js') && !f.endsWith('.css')) continue
  const content = await readFile(f)
  const raw = content.byteLength
  const gz = gzipSync(content, { level: 9 }).byteLength
  totalRaw += raw
  totalGz += gz
  rows.push({ name: f.replace(ROOT + '/', ''), raw, gz })
}

rows.sort((a, b) => b.gz - a.gz)

const lines = [
  '# Bundle measurement',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Per-file (sorted by gzip size)',
  '',
  '| File | Raw | Gzip |',
  '|---|---|---|'
]
for (const r of rows) lines.push(`| ${r.name} | ${fmt(r.raw)} | ${fmt(r.gz)} |`)
lines.push('| **Total** | ' + `**${fmt(totalRaw)}**` + ' | ' + `**${fmt(totalGz)}**` + ' |')
lines.push('')

const KILL = 500 * 1024
lines.push('## Kill criteria check')
lines.push('')
lines.push(`- Total gzip size: ${fmt(totalGz)}`)
lines.push(`- Kill criteria threshold: 500 KB gz`)
lines.push(`- Status: ${totalGz <= KILL ? '✅ PASS' : '❌ FAIL — exceeds threshold'}`)

const outPath = join(ROOT, 'BUNDLE.md')
await writeFile(outPath, lines.join('\n'))
console.log(`Wrote ${outPath}`)
console.log(`Total gzip: ${fmt(totalGz)} (kill threshold: 500 KB)`)
console.log(totalGz <= KILL ? 'PASS' : 'FAIL')
