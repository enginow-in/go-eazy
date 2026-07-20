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
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'GoEazy Housing',
        short_name: 'GoEazy',
        description: 'Find verified rental accommodations seamlessly.',
        theme_color: '#CA3433',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
