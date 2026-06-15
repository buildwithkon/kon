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

import { defineConfig, type UserConfig } from 'vite-plus'
import preact from '@preact/preset-vite'

export const PLUGIN_EXTERNALS = ['preact', 'preact/hooks', 'preact/jsx-runtime', '@preact/signals'] as const

export function pluginConfig(): UserConfig {
  return defineConfig({
    // devToolsEnabled:false drops the preset's transform-hook-names sub-plugin,
    // which does `await import("zimmerframe")` at transform time. zimmerframe
    // ships only an ESM "import" condition that vite-node (under Vitest) can't
    // resolve, breaking tests of hook-bearing plugins. The hook-names devtools
    // transform is dev-DX only and irrelevant to the library build.
    plugins: [preact({ devToolsEnabled: false })],
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
