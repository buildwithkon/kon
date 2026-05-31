/** @jsxImportSource preact */
// Static-site generation step for apps/site.
//
// Runs after `vite build`. Imports the App component source directly
// (tsx handles the TS/JSX), renders each configured route with
// preact-render-to-string, and substitutes the result into the
// dist/index.html shell. Output:
//
//   dist/index.html         (root: '/')
//   dist/stack/index.html   ('/stack')
//
// Search engines see fully-rendered HTML; the bundled JS still loads
// on page open and hydrates for interactivity.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToString } from 'preact-render-to-string'
import { App } from '../src/app'

const ROUTES = ['/', '/stack']

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const DIST = join(ROOT, 'dist')

async function main() {
  const shell = await readFile(join(DIST, 'index.html'), 'utf8')

  for (const url of ROUTES) {
    const html = renderToString(App({ url }))
    const out = shell.replace('<!--app-html-->', html)
    const target = url === '/' ? join(DIST, 'index.html') : join(DIST, url.slice(1), 'index.html')
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, out)
    console.log('[prerender] +', url, '->', target.replace(ROOT + '/', ''))
  }
}

main().catch((e) => {
  console.error('[prerender] x', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
