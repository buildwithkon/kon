#!/usr/bin/env node
/**
 * Lint guard: nothing outside `packages/runtime-core/src/defaults.ts` may
 * embed a literal KON-managed origin like `id.kon.xyz`. Such literals defeat
 * self-host overrides (manifest.deployment.wallet_origin) because they
 * sneak past the runtime config and pin behavior to the default deployment.
 *
 * Run via:  node scripts/lint-no-hardcoded-origins.mjs
 *           (also runs in CI; see .github/workflows/lint.yml)
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const ALLOWED = new Set([
  'packages/runtime-core/src/defaults.ts',
  'scripts/lint-no-hardcoded-origins.mjs'
])

// Directories to skip entirely
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.wrangler',
  'out',
  'coverage',
  'experiments' // spike code is throwaway
])

// File extensions we actually lint
const LINT_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

// The literal we forbid (quoted forms only — bare references in comments or
// docs are fine). We check single-quoted, double-quoted, and template-literal
// forms.
const FORBIDDEN_PATTERNS = [
  /(["'`])id\.kon\.xyz\1/g,
  /(["'`])https?:\/\/id\.kon\.xyz[^"'`]*\1/g
]

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      yield* walk(full)
    } else if (e.isFile()) {
      yield full
    }
  }
}

function relpath(full) {
  return relative(ROOT, full).split(sep).join('/')
}

let violationCount = 0
const violations = []

for await (const full of walk(ROOT)) {
  const rel = relpath(full)
  if (ALLOWED.has(rel)) continue
  const ext = rel.slice(rel.lastIndexOf('.'))
  if (!LINT_EXTS.has(ext)) continue

  const content = await readFile(full, 'utf8')
  for (const pattern of FORBIDDEN_PATTERNS) {
    pattern.lastIndex = 0
    let match
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex iteration
    while ((match = pattern.exec(content)) !== null) {
      const before = content.slice(0, match.index)
      const line = before.split('\n').length
      const col = match.index - before.lastIndexOf('\n')
      violations.push({ file: rel, line, col, match: match[0] })
      violationCount += 1
    }
  }
}

if (violationCount === 0) {
  console.log('lint-no-hardcoded-origins: ✓ no violations')
  process.exit(0)
}

console.error(`lint-no-hardcoded-origins: ✗ ${violationCount} violation(s)`)
console.error('')
console.error('Hardcoded KON-managed origins detected. These break self-host overrides.')
console.error('All KON-managed defaults must live in packages/runtime-core/src/defaults.ts.')
console.error('Consumers must read deployment via resolveDeployment(manifest.deployment).')
console.error('')
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}:${v.col}  ${v.match}`)
}
process.exit(1)
