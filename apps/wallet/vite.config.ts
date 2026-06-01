import { defineConfig } from 'vite-plus'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: true
  },
  server: {
    port: 5175,
    host: '127.0.0.1'
  }
})
