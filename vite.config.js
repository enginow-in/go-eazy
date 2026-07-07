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
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'GoEazy Platform',
        short_name: 'GoEazy',
        description: 'The Housing Standard for Uttarakhand',
        theme_color: '#CA3433',
        background_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
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
