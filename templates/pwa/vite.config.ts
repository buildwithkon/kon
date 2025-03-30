import { reactRouter } from '@react-router/dev/vite'
import { cloudflareDevProxy } from '@react-router/dev/vite/cloudflare'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: isSsrBuild
      ? {
          input: './workers/app.ts'
        }
      : undefined
  },
  server: {
    // https://github.com/xmtp/xmtp-js/tree/main/sdks/browser-sdk#vite
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  optimizeDeps: {
    // https://github.com/xmtp/xmtp-js/tree/main/sdks/browser-sdk#vite-1
    exclude: ['@xmtp/browser-sdk'],
    include: ['@xmtp/proto']
  },
  plugins: [
    VitePWA({
      manifest: false,
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      devOptions: {
        enabled: true
      }
    }),
    cloudflareDevProxy({
      getLoadContext({ context }) {
        return { cloudflare: context.cloudflare }
      }
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths()
  ]
}))
