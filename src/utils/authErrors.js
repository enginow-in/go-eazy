/**
 * Enhanced authentication error handling and user-friendly messages
 */

export const AUTH_ERROR_CODES = {
  // Supabase Auth Error Codes
  INVALID_CREDENTIALS: 'invalid_grant',
  USER_NOT_FOUND: 'user_not_found',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  SIGNUP_DISABLED: 'signup_disabled',
  EMAIL_ADDRESS_INVALID: 'invalid_email',
  PASSWORD_TOO_SHORT: 'password_too_short',
  USER_ALREADY_REGISTERED: 'user_already_registered',
  RATE_LIMIT_EXCEEDED: 'too_many_requests',
  SESSION_EXPIRED: 'session_not_found',
  
  // Custom Error Codes
  ACCOUNT_LOCKED: 'account_locked',
  WEAK_PASSWORD: 'weak_password',
  EMAIL_DOMAIN_BLOCKED: 'email_domain_blocked'
}

export const getAuthErrorMessage = (error) => {
  const message = error?.message?.toLowerCase() || ''
  const code = error?.error_code || error?.code || ''
  
  // Rate limiting errors
  if (message.includes('too many requests') || message.includes('rate limit')) {
    if (message.includes('email')) {
      return 'Too many verification emails sent. Please wait before requesting another one.'
    }
    return 'Too many attempts. Please wait a moment before trying again.'
  }
  
  // Email verification errors
  if (message.includes('email not confirmed') || message.includes('confirm your email')) {
    return 'Please verify your email address before logging in. Check your inbox for the verification link.'
  }
  
  if (message.includes('email rate limit exceeded')) {
    return 'Email rate limit exceeded. Please wait before requesting another verification email.'
  }
  
  // Password-related errors
  if (message.includes('invalid login credentials') || message.includes('wrong password')) {
    return 'Incorrect email or password. Please check your credentials and try again.'
  }
  
  if (message.includes('password should be at least') || code === AUTH_ERROR_CODES.PASSWORD_TOO_SHORT) {
    return 'Password must be at least 8 characters long with uppercase, lowercase, number, and special character.'
  }
  
  if (message.includes('password is too weak') || code === AUTH_ERROR_CODES.WEAK_PASSWORD) {
    return 'Password is too weak. Please choose a stronger password with mixed characters.'
  }
  
  // User registration errors
  if (message.includes('user already registered') || code === AUTH_ERROR_CODES.USER_ALREADY_REGISTERED) {
    return 'An account with this email already exists. Please log in instead or reset your password.'
  }
  
  if (message.includes('signup is disabled') || code === AUTH_ERROR_CODES.SIGNUP_DISABLED) {
    return 'Account registration is currently disabled. Please contact support for assistance.'
  }
  
  // Email validation errors
  if (message.includes('unable to validate email') || message.includes('invalid email')) {
    return 'Please enter a valid email address.'
  }
  
  if (message.includes('email address not found')) {
    return 'No account found with this email address. Please check the email or sign up for a new account.'
  }
  
  // Session and authentication errors
  if (message.includes('session not found') || message.includes('jwt expired')) {
    return 'Your session has expired. Please log in again.'
  }
  
  if (message.includes('refresh token not found') || message.includes('invalid refresh token')) {
    return 'Authentication expired. Please log in again.'
  }
  
  // Network and server errors
  if (message.includes('network error') || message.includes('fetch')) {
    return 'Connection error. Please check your internet connection and try again.'
  }
  
  if (message.includes('internal server error') || message.includes('500')) {
    return 'Server error. Please try again in a few moments.'
  }
  
  if (message.includes('service unavailable') || message.includes('503')) {
    return 'Service temporarily unavailable. Please try again later.'
  }
  
  // OAuth errors
  if (message.includes('oauth')) {
    if (message.includes('cancelled') || message.includes('denied')) {
      return 'Sign-in was cancelled. Please try again.'
    }
    return 'Sign-in with Google failed. Please try again or use email/password.'
  }
  
  // Account security errors
  if (message.includes('account locked') || code === AUTH_ERROR_CODES.ACCOUNT_LOCKED) {
    return 'Account has been locked for security reasons. Please contact support.'
  }
  
  if (message.includes('suspicious activity')) {
    return 'Unusual activity detected. Please verify your identity or contact support.'
  }
  
  // Password reset specific errors
  if (message.includes('password reset') || message.includes('reset token')) {
    if (message.includes('expired')) {
      return 'Password reset link has expired. Please request a new one.'
    }
    if (message.includes('invalid')) {
      return 'Invalid password reset link. Please request a new one.'
    }
    return 'Password reset failed. Please try requesting a new reset link.'
  }
  
  // Email verification specific errors
  if (message.includes('confirmation token') || message.includes('verify')) {
    if (message.includes('expired')) {
      return 'Email verification link has expired. Please request a new verification email.'
    }
    if (message.includes('invalid')) {
      return 'Invalid verification link. Please request a new verification email.'
    }
    return 'Email verification failed. Please try again or request a new verification email.'
  }
  
  // Generic fallback with original message if it's user-friendly
  if (error?.message && error.message.length < 100 && !error.message.includes('Error:')) {
    return error.message
  }
  
  // Final fallback
  return 'Something went wrong. Please try again or contact support if the problem persists.'
}

/**
 * Categorize errors for different UI treatments
 */
export const getErrorCategory = (error) => {
  const message = error?.message?.toLowerCase() || ''
  
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'rate_limit'
  }
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network'
  }
  
  if (message.includes('server') || message.includes('500') || message.includes('503')) {
    return 'server'
  }
  
  if (message.includes('email') && (message.includes('confirm') || message.includes('verify'))) {
    return 'email_verification'
  }
  
  if (message.includes('password') || message.includes('credentials')) {
    return 'authentication'
  }
  
  return 'generic'
}

/**
 * Get suggested actions based on error type
 */
export const getErrorSuggestions = (error) => {
  const category = getErrorCategory(error)
  const message = error?.message?.toLowerCase() || ''
  
  const suggestions = []
  
  switch (category) {
    case 'rate_limit':
      suggestions.push('Wait a few minutes before trying again')
      suggestions.push('Clear your browser cache and cookies')
      break
      
    case 'network':
      suggestions.push('Check your internet connection')
      suggestions.push('Try refreshing the page')
      suggestions.push('Disable VPN if you\'re using one')
      break
      
    case 'server':
      suggestions.push('Try again in a few minutes')
      suggestions.push('Check our status page for updates')
      break
      
    case 'email_verification':
      suggestions.push('Check your spam/junk folder')
      suggestions.push('Ensure the email address is correct')
      suggestions.push('Request a new verification email')
      break
      
    case 'authentication':
      if (message.includes('password')) {
        suggestions.push('Double-check your password')
        suggestions.push('Try resetting your password')
        suggestions.push('Ensure caps lock is not on')
      } else if (message.includes('email')) {
        suggestions.push('Verify your email address spelling')
        suggestions.push('Try signing up if you don\'t have an account')
      }
      break
      
    default:
      suggestions.push('Refresh the page and try again')
      suggestions.push('Clear browser cache and cookies')
      suggestions.push('Contact support if the issue persists')
  }
  
  return suggestions
}

/**
 * Format error for logging while removing sensitive information
 */
export const formatErrorForLogging = (error, context = {}) => {
  const sanitizedError = {
    message: error?.message,
    code: error?.code || error?.error_code,
    status: error?.status,
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      // Remove any potentially sensitive data
      email: context.email ? '[REDACTED]' : undefined,
      password: undefined,
      token: undefined
    }
  }
  
  return sanitizedError
}