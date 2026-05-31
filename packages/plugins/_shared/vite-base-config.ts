/**
 * Shared Vite library build config for KON v2 plugins.
 *
 * Each plugin imports this and re-exports a Vite config so the per-plugin
 * vite.config.ts stays a one-liner. Externals match the import map served
 * by apps/runtime/index.html so dynamically-loaded plugins resolve preact
 * + @preact/signals against the runtime's pinned CDN versions instead of
 * bundling their own copies.
 *
 * Output: dist/plugin.js (single self-contained ES module, default
 * export = KonPluginComponent). That file is what gets uploaded to IPFS
 * by scripts/publish-plugin.mjs.
 */

import { defineConfig, type UserConfig } from 'vite'
import preact from '@preact/preset-vite'

export const PLUGIN_EXTERNALS = ['preact', 'preact/hooks', 'preact/jsx-runtime', '@preact/signals'] as const

export function pluginConfig(): UserConfig {
  return defineConfig({
    plugins: [preact()],
    build: {
      lib: {
        entry: 'src/index.tsx',
        formats: ['es'],
        fileName: 'plugin'
      },
      rollupOptions: {
        external: [...PLUGIN_EXTERNALS]
      },
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      reportCompressedSize: true
    }
  })
}
