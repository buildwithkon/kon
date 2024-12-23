import build from '@hono/vite-build/cloudflare-pages'
import honox from 'honox/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    honox({
      client: {
        input: ['/app/site.css']
      }
    }),
    build()
  ]
})
