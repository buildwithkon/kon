import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',
      workbox: {
        // IPFS responses are CID-addressed, therefore immutable: cache forever.
        // ENS RPC reads are mutable: stale-while-revalidate.
        // Static assets fall back to a network-first policy with a small cache.
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Any IPFS gateway path. The CID in the URL is the cache key.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/ipfs/') || url.hostname.endsWith('.ipfs.dweb.link'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'kon-ipfs',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // .limo gateway path (ENS-to-IPFS through eth.limo).
            urlPattern: ({ url }) => url.hostname.endsWith('.limo'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'kon-ipfs-limo',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // ENS / Ethereum RPCs — mutable, but short revalidation keeps us fresh.
            urlPattern: ({ url }) =>
              /\.(llamarpc|ankr|cloudflare-eth|alchemy|infura)\.com$/.test(url.hostname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'kon-ens-rpc',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 10 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        // PWA manifest. The publish pipeline will rewrite name/icons per app at
        // publish time; this is the default shell shown when an app is
        // installed from id.kon.xyz before any per-app manifest is loaded.
        name: 'KON',
        short_name: 'KON',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/'
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // Stable entry filename. The runtime is uploaded by-CID to IPFS;
        // CIDs already act as cache keys so we don't need hashed filenames.
        // Apps load this via `<gateway>/ipfs/<runtime-cid>/runtime.js`,
        // a stable path that doesn't change across rebuilds with the
        // same source — only the CID changes, which is the right unit
        // of versioning here.
        entryFileNames: 'runtime.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
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
