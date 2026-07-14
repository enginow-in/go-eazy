import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Plugin to silence [vite] HMR browser console messages
const silenceViteLogs = () => ({
  name: 'silence-vite-hmr-logs',
  transform(code, id) {
    if (id.includes('/@vite/client') || id.includes('/vite/dist/client')) {
      // More aggressive regex to catch styled and unstyled [vite] messages
      // This targets console.log/debug/info calls that start with [vite]
      return code
        .replace(
          /console\.(log|debug|info)\(['"`](%c)?\[vite\][\s\S]*?['"`]\s*(,[^)]*)?\)/g,
          '(void 0)'
        )
    }
  },
})

const logger = createLogger()
const loggerWarn = logger.warn
logger.warn = (msg, options) => {
  if (msg.includes('vite') || msg.includes('[Violation]')) return
  loggerWarn(msg, options)
}

export default defineConfig({
  plugins: [
    react(),
    silenceViteLogs(),
    VitePWA({
      // Auto-register service worker and update in the background.
      registerType: 'autoUpdate',
      // We provide `public/manifest.webmanifest` ourselves.
      manifest: false,
      filename: 'sw.js',

      // Let VitePWA generate the service worker (no custom src/sw.js needed).
      strategies: 'generateSW',

      workbox: {
        // Offline fallback for navigations (SPA route deep links).
        navigateFallback: '/offline.html',
        clientsClaim: true,

        runtimeCaching: [
          // Cache-first for static assets -> offline access.
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'font' ||
              request.destination === 'image' ||
              request.destination === 'manifest',
            handler: 'CacheFirst',
            options: {
              cacheName: 'goeazy-static-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 250,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },

          // Network-first for Supabase/API calls -> fresh data when online,
          // cached fallback when offline.
          {
            urlPattern: ({ url }) =>
              url.hostname.includes('supabase') ||
              url.pathname.includes('/rest/v1') ||
              url.pathname.includes('/functions/v1'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'goeazy-api-v1',
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],
  customLogger: logger,
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Exclude mapbox-gl from Vite's pre-bundling to fix
  // "Cannot access 'L' before initialization" circular dep error
  optimizeDeps: {
    exclude: ['mapbox-gl'],
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
})

