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
        .replace(/console\.(log|debug|info)\(['"`](%c)?\[vite\][\s\S]*?['"`]\s*(,[^)]*)?\)/g, '(void 0)')
    }
  }
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
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'GoEazy Housing Standard',
        short_name: 'GoEazy',
        description: 'Rent Rooms, PGs & Hostels Easily in Uttarakhand',
        theme_color: '#CA3433',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
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
    }
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
