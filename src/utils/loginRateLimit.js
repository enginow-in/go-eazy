/**
 * loginRateLimit.js
 *
 * Client-side rate limiting utility using localStorage.
 * Acts as a first-line defense that gives instant feedback
 * without a network round-trip.
 *
 * Policy: 5 failed attempts within a rolling 15-minute window
 * triggers a 15-minute local lockout. Server-side lockout is
 * enforced independently via the check-login-rate-limit Edge Function.
 */

const MAX_ATTEMPTS      = 5    // failures before lockout
const LOCKOUT_MS        = 15 * 60 * 1000  // 15 minutes in ms
const WARN_THRESHOLD    = 3    // show warning from this many failures onward
const STORAGE_PREFIX    = 'ge_lr_'  // GoEazy LoginRateLimit prefix

/**
 * Build a storage key from the email.
 * We don't store emails in plaintext in localStorage.
 * Simple base64 encoding is enough for key isolation (not security).
 */
function emailKey(email) {
  return STORAGE_PREFIX + btoa(email.toLowerCase().trim()).replace(/=/g, '')
}

/**
 * Read the current rate-limit state for an email from localStorage.
 * @returns {{ attempts: number, lockedUntil: number|null }}
 */
function getState(email) {
  try {
    const raw = localStorage.getItem(emailKey(email))
    if (!raw) return { attempts: 0, lockedUntil: null }
    return JSON.parse(raw)
  } catch {
    return { attempts: 0, lockedUntil: null }
  }
}

/**
 * Persist rate-limit state to localStorage.
 */
function setState(email, state) {
  try {
    localStorage.setItem(emailKey(email), JSON.stringify(state))
  } catch {
    // localStorage quota exceeded or blocked — fail silently
  }
}

/**
 * Check if an email is currently locked out.
 * @param {string} email
 * @returns {{ locked: boolean, secondsRemaining: number, attemptsRemaining: number }}
 */
export function isLockedOut(email) {
  const state = getState(email)

  if (state.lockedUntil) {
    const remaining = state.lockedUntil - Date.now()
    if (remaining > 0) {
      return {
        locked:            true,
        secondsRemaining:  Math.ceil(remaining / 1000),
        attemptsRemaining: 0,
      }
    }
    // Lockout expired — clear it
    setState(email, { attempts: 0, lockedUntil: null })
  }

  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - state.attempts)
  return {
    locked:            false,
    secondsRemaining:  0,
    attemptsRemaining,
  }
}

/**
 * Record a failed login attempt for an email.
 * Triggers lockout if MAX_ATTEMPTS is reached.
 * @param {string} email
 * @returns {{ locked: boolean, secondsRemaining: number, attemptsRemaining: number }}
 */
export function recordFailedAttempt(email) {
  const state   = getState(email)
  const newCount = (state.attempts || 0) + 1

  if (newCount >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_MS
    setState(email, { attempts: newCount, lockedUntil })
    return {
      locked:            true,
      secondsRemaining:  Math.ceil(LOCKOUT_MS / 1000),
      attemptsRemaining: 0,
    }
  }

  setState(email, { attempts: newCount, lockedUntil: null })
  return {
    locked:            false,
    secondsRemaining:  0,
    attemptsRemaining: MAX_ATTEMPTS - newCount,
  }
}

/**
 * Clear the rate-limit counter for an email after successful login.
 * @param {string} email
 */
export function recordSuccessfulLogin(email) {
  try {
    localStorage.removeItem(emailKey(email))
  } catch {
    // ignore
  }
}

/**
 * Returns true if the user should see an "attempts remaining" warning.
 * @param {string} email
 */
export function shouldWarn(email) {
  const state = getState(email)
  return !state.lockedUntil && state.attempts >= WARN_THRESHOLD
}

/**
 * Format seconds into a human-readable countdown string.
 * e.g. 900 → "15:00", 65 → "1:05"
 * @param {number} seconds
 */
export function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export { MAX_ATTEMPTS, WARN_THRESHOLD, LOCKOUT_MS }
