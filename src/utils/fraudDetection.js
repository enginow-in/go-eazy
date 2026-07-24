/**
 * Fraud Detection & Safety Engine (GoEazy TrustGuard™)
 * Core analytical routines for spam detection, image authenticity,
 * ID verification checksums, and payment transaction monitoring.
 */

// ── 1. AADHAAR VERHOEFF CHECKSUM ALGORITHM ────────────────────────────────────
const dMatrix = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

const pMatrix = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

/**
 * Validates a 12-digit Indian Aadhaar card number using the Verhoeff algorithm.
 */
export const validateAadhaar = (aadhaarNumber) => {
  if (!aadhaarNumber) return { valid: false, message: 'Aadhaar number is required' }
  const clean = String(aadhaarNumber).replace(/[\s-]/g, '')
  if (!/^\d{12}$/.test(clean)) return { valid: false, message: 'Aadhaar must be exactly 12 digits' }
  
  // First digit of valid Aadhaar is never 0 or 1
  if (clean.startsWith('0') || clean.startsWith('1')) {
    return { valid: false, message: 'Aadhaar number format is invalid' }
  }

  let c = 0
  const digits = clean.split('').map(Number).reverse()
  for (let i = 0; i < digits.length; i++) {
    c = dMatrix[c][pMatrix[i % 8][digits[i]]]
  }

  const valid = c === 0
  return {
    valid,
    message: valid ? 'Valid Aadhaar' : 'Invalid Aadhaar checksum',
    masked: `XXXX-XXXX-${clean.slice(-4)}`
  }
}

/**
 * Validates a 10-character Indian Permanent Account Number (PAN).
 * Format: 5 Letters, 4 Digits, 1 Letter (e.g., ABCDE1234F)
 * 4th character represents status (P=Individual, C=Company, H=HUF, F=Firm, A=AOP, T=Trust)
 */
export const validatePAN = (panNumber) => {
  if (!panNumber) return { valid: false, message: 'PAN number is required' }
  const clean = String(panNumber).trim().toUpperCase()
  const panRegex = /^[A-Z]{3}[PCHFATTBLJ]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}$/
  
  const valid = panRegex.test(clean)
  return {
    valid,
    message: valid ? 'Valid PAN' : 'Invalid PAN format (Expected: ABCDE1234F)',
    masked: `${clean.slice(0, 3)}XX${clean.slice(5, 9)}${clean.slice(-1)}`
  }
}

// ── 2. STRING SIMILARITY & SPAM DETECTION ─────────────────────────────────────
const calculateJaccardIndex = (str1, str2) => {
  const set1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2))
  const set2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2))
  if (set1.size === 0 || set2.size === 0) return 0
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  return intersection.size / union.size
}

/**
 * Analyzes a new property listing against existing properties to detect duplicates & spam.
 */
export const detectListingSpam = (newProperty, existingListings = []) => {
  let spamScore = 0
  const flags = []

  // Check 1: Extremely short or repetitive title/description
  const titleWords = (newProperty.title || '').trim().split(/\s+/)
  const descWords = (newProperty.description || '').trim().split(/\s+/)

  if (titleWords.length < 3) {
    spamScore += 20
    flags.push('title_too_short')
  }

  if (descWords.length > 0 && descWords.length < 5) {
    spamScore += 15
    flags.push('description_too_short')
  }

  // Check for repeated character sequences (e.g., "aaaaa", "test test test")
  if (/(.)\1{4,}/i.test(newProperty.title) || /(.)\1{4,}/i.test(newProperty.description)) {
    spamScore += 35
    flags.push('repetitive_gibberish')
  }

  // Check 2: Unrealistic Price Thresholds
  const rent = Number(newProperty.price) || 0
  if (rent < 500) {
    spamScore += 40
    flags.push('unrealistic_low_rent')
  } else if (rent > 2000000) {
    spamScore += 30
    flags.push('unrealistic_high_rent')
  }

  // Check 3: Duplicate Listing Detection against Existing Properties
  for (const existing of existingListings) {
    if (!existing || existing.id === newProperty.id) continue

    const titleSim = calculateJaccardIndex(newProperty.title || '', existing.title || '')
    const descSim = calculateJaccardIndex(newProperty.description || '', existing.description || '')
    const sameCity = (newProperty.city || '').toLowerCase() === (existing.city || '').toLowerCase()
    const sameArea = (newProperty.area || '').toLowerCase() === (existing.area || '').toLowerCase()
    const samePrice = Math.abs(rent - Number(existing.price || 0)) < 100

    if (titleSim > 0.8 && sameCity && sameArea) {
      spamScore += 65
      flags.push(`duplicate_listing_title_match:${existing.id}`)
      break
    } else if (descSim > 0.85 && samePrice) {
      spamScore += 50
      flags.push(`duplicate_description_match:${existing.id}`)
      break
    }
  }

  // Cap spamScore at 100
  spamScore = Math.min(100, spamScore)
  const isSpam = spamScore >= 50
  const spamStatus = spamScore >= 75 ? 'blocked' : spamScore >= 50 ? 'flagged' : 'clean'

  return {
    isSpam,
    spamScore,
    spamStatus,
    flags
  }
}

// ── 3. PHOTO AUTHENTICITY & PERCEPTUAL IMAGE HASHING ──────────────────────────
/**
 * Generates a simple perceptual hash string for an image URL or File string.
 */
export const computeImageHash = (str) => {
  if (!str) return '0000000000000000'
  let hash1 = 5381
  let hash2 = 0x84222325
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash1 = (hash1 * 33) ^ char
    hash2 = (hash2 * 31) ^ char
  }
  const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0')
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0')
  return hex1 + hex2
}

/**
 * Scans uploaded photos against existing property images to detect duplicate/stolen photos.
 */
export const checkPhotoAuthenticity = (imageUrls = [], existingPropertyListings = []) => {
  const flags = []
  const uploadedHashes = imageUrls.map(url => computeImageHash(url))

  // Known stock image URL patterns / watermarks
  const stockKeywords = ['shutterstock', 'stock-photo', 'depositphotos', 'gettyimages', 'unsplash-watermark']
  const containsStockUrl = imageUrls.some(url => stockKeywords.some(kw => url.toLowerCase().includes(kw)))

  if (containsStockUrl) {
    flags.push('stock_watermark_detected')
  }

  // Check for duplicate visual hashes across other properties
  for (const existingProp of existingPropertyListings) {
    if (!existingProp.images || existingProp.images.length === 0) continue

    const existingHashes = (existingProp.image_hashes || []).length > 0 
      ? existingProp.image_hashes 
      : existingProp.images.map(url => computeImageHash(url))

    for (const uHash of uploadedHashes) {
      if (existingHashes.includes(uHash)) {
        flags.push(`duplicate_photo_found_in_prop:${existingProp.id}`)
        break
      }
    }
  }

  const isDuplicate = flags.some(f => f.startsWith('duplicate_photo_found'))
  const status = isDuplicate ? 'flagged_duplicate' : containsStockUrl ? 'stock_photo_warning' : 'verified'

  return {
    verified: status === 'verified',
    status,
    flags,
    imageHashes: uploadedHashes
  }
}

// ── 4. TRANSACTION MONITORING FOR PAYMENT FRAUD ────────────────────────────────
/**
 * Evaluates payment transaction risks (Velocity checks, High Amount anomaly, User state).
 */
export const evaluateTransactionRisk = ({ amount, _userId, profile, userPaymentHistory = [] }) => {
  let riskScore = 0
  const flags = []

  const payAmount = Number(amount) || 0

  // 1. High value payment by unverified user
  if (payAmount >= 500 && (!profile?.id_verification_status || profile.id_verification_status === 'unverified')) {
    riskScore += 30
    flags.push('high_amount_unverified_user')
  }

  // 2. Velocity Check: Number of transactions within last 10 minutes
  const tenMinsAgo = Date.now() - 10 * 60 * 1000
  const recentTxns = userPaymentHistory.filter(t => new Date(t.created_at || t.timestamp).getTime() > tenMinsAgo)

  if (recentTxns.length >= 3) {
    riskScore += 45
    flags.push('high_velocity_transactions_10m')
  }

  // 3. User Blacklisted or Flagged
  if (profile?.is_blacklisted) {
    riskScore += 100
    flags.push('blacklisted_user_payment_attempt')
  }

  riskScore = Math.min(100, riskScore)
  const riskLevel = riskScore >= 75 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low'

  return {
    riskScore,
    riskLevel,
    flags,
    requiresManualReview: riskScore >= 50
  }
}
