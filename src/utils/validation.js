const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const PHONE_REGEX = /^[+]?[\d\s\-()]{7,15}$/
const PINCODE_REGEX = /^\d{6}$$

const HTML_TAG_REGEX = /<[^>]*>/g
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
const EVENT_HANDLER_REGEX = /on\w+\s*=/gi
const JAVASCRIPT_URL_REGEX = /javascript\s*:/gi

export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str
  return str
    .replace(SCRIPT_TAG_REGEX, '')
    .replace(HTML_TAG_REGEX, '')
    .replace(EVENT_HANDLER_REGEX, '')
    .replace(JAVASCRIPT_URL_REGEX, '')
    .trim()
}

export const sanitizeObject = (obj) => {
  const cleaned = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      cleaned[key] = sanitizeInput(value)
    } else {
      cleaned[key] = value
    }
  }
  return cleaned
}

export const validateEmail = (email) => {
  if (!email) return true
  return EMAIL_REGEX.test(email)
}

export const validatePhone = (phone) => {
  if (!phone) return false
  return PHONE_REGEX.test(phone)
}

export const validatePincode = (pincode) => {
  if (!pincode) return true
  return PINCODE_REGEX.test(pincode)
}

export const validatePrice = (price) => {
  const num = Number(price)
  return !isNaN(num) && num > 0 && num < 10000000
}

export const validateRequired = (value) => {
  if (typeof value === 'string') return value.trim().length > 0
  return value !== null && value !== undefined
}
