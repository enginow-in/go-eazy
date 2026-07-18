/**
 * Error Logging Service
 * Logs errors to console in dev, could send to external service (Sentry, LogRocket) in production
 * Sanitizes sensitive data before logging
 */

const SENSITIVE_KEYS = ['password', 'token', 'key', 'secret', 'authorization', 'apikey', 'card', 'cvv']

/**
 * Sanitize an object by removing sensitive fields
 * @param {*} obj - Object to sanitize
 * @returns {*} Sanitized object (deep clone)
 */
const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item))
  }
  
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

/**
 * Extract meaningful error message from various error types
 * @param {Error|string|object} error - Error to extract message from
 * @returns {string} User-friendly error message
 */
export const extractErrorMessage = (error) => {
  if (!error) return 'Something went wrong'
  
  // String error
  if (typeof error === 'string') return error
  
  // Standard Error object
  if (error instanceof Error) return error.message
  
  // Supabase error
  if (error.message) return error.message
  if (error.error_description) return error.error_description
  
  // Network/API error response
  if (error.detail) return error.detail
  if (error.error) return typeof error.error === 'string' ? error.error : error.error.message
  if (error.statusText) return error.statusText
  
  // Fallback
  return 'Something went wrong'
}

/**
 * Categorize error for better UX messaging
 * @param {Error|string|object} error - Error to categorize
 * @returns {object} {type, message, retryable, statusCode}
 */
export const categorizeError = (error) => {
  const message = extractErrorMessage(error)
  
  // Network errors
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return { type: 'network', message: 'Network error — check your connection', retryable: true, statusCode: 0 }
  }
  
  // Authentication errors
  if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('session expired')) {
    return { type: 'auth', message: 'Session expired — please log in again', retryable: false, statusCode: 401 }
  }
  
  // Payment errors
  if (message.toLowerCase().includes('payment') || message.toLowerCase().includes('razorpay')) {
    return { type: 'payment', message: 'Payment verification failed — please try again', retryable: true, statusCode: 402 }
  }
  
  // Validation errors
  if (message.toLowerCase().includes('required') || message.toLowerCase().includes('invalid')) {
    return { type: 'validation', message, retryable: false, statusCode: 422 }
  }
  
  // Permission/RLS errors
  if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('denied')) {
    return { type: 'permission', message: 'Access denied — you don\'t have permission for this action', retryable: false, statusCode: 403 }
  }
  
  // Rate limit errors
  if (message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('too many')) {
    return { type: 'rateLimit', message: 'Too many requests — please wait a moment and try again', retryable: true, statusCode: 429 }
  }
  
  // Server errors
  if (message.toLowerCase().includes('server') || message.toLowerCase().includes('internal')) {
    return { type: 'server', message: 'Server error — please try again later', retryable: true, statusCode: 500 }
  }
  
  // Fallback
  return { type: 'unknown', message, retryable: false, statusCode: null }
}

/**
 * Log error to console (development) or external service (production)
 * @param {Error|string|object} error - Error to log
 * @param {object} context - Additional context (page, action, user, etc.)
 */
export const logError = (error, context = {}) => {
  const timestamp = new Date().toISOString()
  const isDev = import.meta.env.DEV
  
  const errorInfo = {
    timestamp,
    message: extractErrorMessage(error),
    category: categorizeError(error).type,
    stack: error?.stack || 'No stack trace',
    context: sanitize(context),
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
  }
  
  if (isDev) {
    console.group(`🚨 Error: ${errorInfo.message}`)
    console.error('Details:', errorInfo)
    console.groupEnd()
  } else {
    // In production, you could send to: Sentry, LogRocket, DataDog, etc.
    // Example: Sentry.captureException(error, { extra: errorInfo })
    // For now, silently log to avoid exposing errors to users
    if (window.__ERROR_LOG) {
      window.__ERROR_LOG.push(errorInfo)
    } else {
      window.__ERROR_LOG = [errorInfo]
    }
  }
}

/**
 * Error boundary wrapper with retry capability
 * @param {Error} error - Caught error
 * @param {object} context - Error context {page, action, user}
 * @param {function} retryFn - Optional retry function
 * @returns {object} {message, category, retryable, retry}
 */
export const handleError = (error, context = {}, retryFn = null) => {
  logError(error, context)
  const category = categorizeError(error)
  
  return {
    message: category.message,
    category: category.type,
    retryable: category.retryable,
    statusCode: category.statusCode,
    retry: retryFn && category.retryable ? retryFn : null,
  }
}

export default {
  extractErrorMessage,
  categorizeError,
  logError,
  handleError,
  sanitize,
}
