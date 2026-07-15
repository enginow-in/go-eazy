/**
 * Production-safe console logger.
 *
 * In development, behaves exactly like the native console.
 * In production builds, error/warn/log output is suppressed so that
 * internal error messages, backend field names, and Supabase error
 * payloads are never exposed in the browser DevTools console —
 * consistent with the app's Zero-Trust / anti-scraping frontend model.
 *
 * Usage:
 *   import { logger } from '../utils/logger'
 *   logger.error('fetchProperties error:', err)
 */

const isDev = import.meta.env.DEV

export const logger = {
  log: (...args) => {
    if (isDev) console.log(...args)
  },
  warn: (...args) => {
    if (isDev) console.warn(...args)
  },
  error: (...args) => {
    if (isDev) console.error(...args)
  },
}
