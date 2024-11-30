import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import honox from 'honox/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    honox({
      client: {
        input: ['/app/style.css']
      }
    }),
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ]
})
