import toast from 'react-hot-toast'
import { categorizeError, logError } from '@/services/errorLogger'

/**
 * Centralized API error handler
 * Converts API responses into user-friendly toast notifications with retry capability
 */

/**
 * Parse error response from various sources (fetch, Supabase, etc.)
 * @param {Response|Error|object} errorResponse - Error from API call
 * @returns {object} Parsed error object
 */
export const parseApiError = async (errorResponse) => {
  // Network error (no response)
  if (errorResponse instanceof TypeError) {
    return {
      type: 'network',
      message: 'Network error — please check your connection',
      statusCode: 0,
      originalError: errorResponse,
    }
  }

  // HTTP Response object
  if (errorResponse instanceof Response) {
    const contentType = errorResponse.headers.get('content-type')
    let data = {}
    
    try {
      if (contentType?.includes('application/json')) {
        data = await errorResponse.json()
      } else {
        data = { text: await errorResponse.text() }
      }
    } catch (e) {
      // Response body parsing failed
    }

    return {
      type: 'api',
      message: data.error || data.detail || data.message || errorResponse.statusText || 'API request failed',
      statusCode: errorResponse.status,
      data,
      originalError: errorResponse,
    }
  }

  // Error object (likely from try/catch)
  if (errorResponse instanceof Error) {
    return {
      type: 'error',
      message: errorResponse.message,
      statusCode: null,
      originalError: errorResponse,
    }
  }

  // Plain object (Supabase or custom error)
  if (typeof errorResponse === 'object') {
    return {
      type: 'object',
      message: errorResponse.message || errorResponse.error || errorResponse.detail || 'Unknown error',
      statusCode: errorResponse.status || errorResponse.statusCode,
      data: errorResponse,
      originalError: errorResponse,
    }
  }

  // String error
  if (typeof errorResponse === 'string') {
    return {
      type: 'string',
      message: errorResponse,
      statusCode: null,
      originalError: errorResponse,
    }
  }

  // Fallback
  return {
    type: 'unknown',
    message: 'Something went wrong',
    statusCode: null,
    originalError: errorResponse,
  }
}

/**
 * Display API error to user with context-aware messaging
 * @param {Response|Error|object} error - Error from API
 * @param {object} options - Configuration {context, duration, onRetry, log}
 * @returns {object} Error info and retry function
 */
export const showApiError = async (error, options = {}) => {
  const {
    context = {},
    duration = 5000,
    onRetry = null,
    log = true,
  } = options

  // Parse the error
  const parsed = await parseApiError(error)
  
  // Log error in dev/prod
  if (log) {
    logError(parsed.originalError, {
      ...context,
      statusCode: parsed.statusCode,
      type: parsed.type,
    })
  }

  // Categorize for user-facing message
  const category = categorizeError(parsed.originalError)

  // Build toast message
  let message = category.message
  
  // Add status code for debugging (dev only)
  if (import.meta.env.DEV && parsed.statusCode) {
    message += ` [${parsed.statusCode}]`
  }

  // Show toast with retry button if applicable
  if (category.retryable && onRetry) {
    toast.error(
      (t) => (
        <div className="flex flex-col gap-2">
          <p>{message}</p>
          <button
            onClick={() => {
              toast.dismiss(t.id)
              onRetry()
            }}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      ),
      { duration: 0 } // Don't auto-dismiss if showing retry button
    )
  } else {
    toast.error(message, { duration })
  }

  return {
    message,
    category: category.type,
    retryable: category.retryable,
    statusCode: parsed.statusCode,
    retry: category.retryable && onRetry ? onRetry : null,
  }
}

/**
 * Wrap an async API call with automatic error handling
 * @param {function} fn - Async function to execute
 * @param {object} options - Configuration {context, showToast, onRetry}
 * @returns {Promise} Result of function or error object
 */
export const withErrorHandler = async (fn, options = {}) => {
  const {
    context = {},
    showToast = true,
    onRetry = null,
  } = options

  try {
    return await fn()
  } catch (error) {
    if (showToast) {
      await showApiError(error, { context, onRetry, log: true })
    } else {
      logError(error, context)
    }
    throw error
  }
}

/**
 * Validate HTTP Response status and throw meaningful error
 * @param {Response} response - Fetch response object
 * @param {string} errorPrefix - Prefix for error message
 * @throws {Error} Throws if response not ok
 */
export const validateResponse = async (response, errorPrefix = 'Request failed') => {
  if (!response.ok) {
    let errorMsg = errorPrefix
    try {
      const data = await response.json()
      errorMsg = data.error || data.detail || errorMsg
    } catch (e) {
      // Response not JSON
    }
    throw new Error(`${errorMsg} (${response.status})`)
  }
  return response
}

/**
 * Supabase-specific error handler
 * Handles RLS violations, auth errors, and other Supabase-specific issues
 */
export const handleSupabaseError = async (error, options = {}) => {
  const message = error?.message || error?.error_description || 'Supabase error'
  
  // RLS violation
  if (message.includes('policy') || message.includes('permission')) {
    return showApiError(
      new Error('You don\'t have permission to access this resource'),
      { ...options, context: { ...options.context, type: 'RLS' } }
    )
  }
  
  // Auth error
  if (message.includes('invalid') || message.includes('expired')) {
    return showApiError(
      new Error('Authentication failed — please log in again'),
      { ...options, context: { ...options.context, type: 'Auth' } }
    )
  }
  
  // Generic Supabase error
  return showApiError(error, options)
}

export default {
  parseApiError,
  showApiError,
  withErrorHandler,
  validateResponse,
  handleSupabaseError,
}
