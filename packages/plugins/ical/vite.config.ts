import { defineConfig } from 'vite-plus'
import preact from '@preact/preset-vite'

// Cannot reuse pluginConfig() directly because the preact preset's
// transform-hook-names sub-plugin does `async import("zimmerframe")` at
// transform time, and zimmerframe ships only an ESM "import" condition —
// Vite-node (running under Vitest) can't resolve it, causing test failures.
// Passing devToolsEnabled:false disables that sub-plugin for all environments.
export default defineConfig({
  plugins: [preact({ devToolsEnabled: false })],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: 'plugin'
    },
    rollupOptions: {
      external: ['preact', 'preact/hooks', 'preact/jsx-runtime', '@preact/signals']
    },
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: true
  }
})
