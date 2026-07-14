/**
 * Comprehensive validation utilities for enhanced authentication
 */

// Email validation regex - more comprehensive than basic pattern
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Password strength requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  maxLength: 128,
}

// Common weak passwords to reject
const COMMON_WEAK_PASSWORDS = [
  'password', '12345678', 'qwerty123', 'abc123456', 'password123',
  'admin123', 'welcome123', 'changeme', 'letmein', '123456789'
]

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  const errors = []
  
  if (!email) {
    errors.push('Email is required')
    return { isValid: false, errors }
  }
  
  if (!EMAIL_REGEX.test(email)) {
    errors.push('Please enter a valid email address')
  }
  
  if (email.length > 254) {
    errors.push('Email address is too long')
  }
  
  // Check for common typos
  const commonDomainTypos = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com'
  }
  
  const domain = email.split('@')[1]
  if (domain && commonDomainTypos[domain]) {
    errors.push(`Did you mean ${email.replace(domain, commonDomainTypos[domain])}?`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = []
  
  if (!password) {
    errors.push('Password is required')
    return { isValid: false, errors, strength: 0 }
  }
  
  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
  }
  
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters`)
  }
  
  // Character requirements
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  // Common weak passwords
  if (COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password')
  }
  
  // Sequential characters check (123, abc, etc.)
  if (hasSequentialChars(password)) {
    errors.push('Avoid sequential characters like "123" or "abc"')
  }
  
  // Calculate strength score
  const strength = calculatePasswordStrength(password)
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

/**
 * Calculate password strength score (0-100)
 */
export const calculatePasswordStrength = (password) => {
  let score = 0
  
  // Length scoring
  if (password.length >= 8) score += 20
  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10
  
  // Character type scoring
  if (/[a-z]/.test(password)) score += 10
  if (/[A-Z]/.test(password)) score += 10
  if (/\d/.test(password)) score += 10
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) score += 15
  
  // Variety bonus
  const uniqueChars = new Set(password.toLowerCase()).size
  if (uniqueChars >= password.length * 0.7) score += 10
  
  // Penalty for common patterns
  if (COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())) score -= 30
  if (hasSequentialChars(password)) score -= 20
  if (hasRepeatedChars(password)) score -= 10
  
  return Math.max(0, Math.min(100, score))
}

/**
 * Check for sequential characters
 */
const hasSequentialChars = (password) => {
  const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm']
  
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 3; i++) {
      const subseq = seq.substring(i, i + 3)
      if (password.toLowerCase().includes(subseq) || password.toLowerCase().includes(subseq.split('').reverse().join(''))) {
        return true
      }
    }
  }
  return false
}

/**
 * Check for excessive repeated characters
 */
const hasRepeatedChars = (password) => {
  return /(.)\1{2,}/.test(password) // 3 or more repeated characters
}

/**
 * Validate full name
 */
export const validateFullName = (name) => {
  const errors = []
  
  if (!name) {
    errors.push('Full name is required')
    return { isValid: false, errors }
  }
  
  if (name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters')
  }
  
  if (name.length > 50) {
    errors.push('Full name must be less than 50 characters')
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
    errors.push('Full name can only contain letters, spaces, hyphens, and apostrophes')
  }
  
  // Check for at least two words (first and last name)
  const nameParts = name.trim().split(/\s+/)
  if (nameParts.length < 2) {
    errors.push('Please provide both first and last name')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate phone number (optional field)
 */
export const validatePhoneNumber = (phone) => {
  const errors = []
  
  if (!phone) {
    return { isValid: true, errors } // Phone is optional
  }
  
  // Remove all non-digits for validation
  const digitsOnly = phone.replace(/\D/g, '')
  
  // Indian phone number validation (10 digits, starting with 6-9)
  if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
    errors.push('Please enter a valid 10-digit phone number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get password strength label and color
 */
export const getPasswordStrengthInfo = (strength) => {
  if (strength < 30) return { label: 'Weak', color: 'text-red-600', bgColor: 'bg-red-600' }
  if (strength < 60) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-600' }
  if (strength < 80) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-600' }
  return { label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-600' }
}

/**
 * Comprehensive form validation for signup
 */
export const validateSignupForm = ({ name, email, password, role }) => {
  const errors = {}
  
  const nameValidation = validateFullName(name)
  if (!nameValidation.isValid) {
    errors.name = nameValidation.errors[0]
  }
  
  const emailValidation = validateEmail(email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors[0]
  }
  
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors[0]
  }
  
  if (!role || !['user', 'landlord', 'service_provider'].includes(role)) {
    errors.role = 'Please select your role'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Comprehensive form validation for login
 */
export const validateLoginForm = ({ email, password }) => {
  const errors = {}
  
  const emailValidation = validateEmail(email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors[0]
  }
  
  if (!password) {
    errors.password = 'Password is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}