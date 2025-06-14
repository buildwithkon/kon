import { cloudflare } from '@cloudflare/vite-plugin'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
// import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    // VitePWA({
    //   manifest: false,
    //   injectRegister: 'auto',
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    //   },
    //   devOptions: {
    //     enabled: true
    //   }
    // }),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths()
  ],
  optimizeDeps: {
    exclude: ['@xmtp/wasm-bindings', '@xmtp/browser-sdk'],
    include: ['@xmtp/proto']
  }
})
