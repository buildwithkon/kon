import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/viem')) return 'viem'
          if (id.includes('node_modules/preact') || id.includes('@preact/signals')) return 'preact'
        }
      }
    }
  },
  server: {
    port: 5174,
    host: '127.0.0.1'
  }
})
