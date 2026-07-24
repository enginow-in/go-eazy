import { supabase } from '../lib/supabase'
import { validateAadhaar, validatePAN } from '../utils/fraudDetection'

/**
 * Service handling DB interactions for Fraud Detection & Safety System
 */

// ── 1. PHONE OTP VERIFICATION ────────────────────────────────────────────────
export const sendPhoneOtpService = async (phoneNumber) => {
  if (!phoneNumber) throw new Error('Phone number is required')
  
  // Simulated OTP dispatch (returns 6-digit code for testing & verification)
  const simulatedOtp = String(Math.floor(100000 + Math.random() * 900000))
  // Save OTP in sessionStorage for local verification simulation
  sessionStorage.setItem(`otp_${phoneNumber}`, JSON.stringify({
    code: simulatedOtp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  }))

  return { success: true, simulatedOtp, message: 'OTP sent successfully to ' + phoneNumber }
}

export const verifyPhoneOtpService = async (userId, phoneNumber, inputOtp) => {
  const storedData = sessionStorage.getItem(`otp_${phoneNumber}`)
  if (!storedData) {
    throw new Error('No active OTP found. Please request a new code.')
  }

  const { code, expiresAt } = JSON.parse(storedData)
  if (Date.now() > expiresAt) {
    sessionStorage.removeItem(`otp_${phoneNumber}`)
    throw new Error('OTP has expired. Please request a new code.')
  }

  if (inputOtp !== code && inputOtp !== '123456') { // Allow 123456 for demo
    throw new Error('Invalid OTP code. Please try again.')
  }

  // Clear OTP from storage
  sessionStorage.removeItem(`otp_${phoneNumber}`)

  // Update DB profile with phone_verified = true
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('profiles')
    .update({
      phone: phoneNumber,
      phone_verified: true,
      phone_verified_at: now
    })
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// ── 2. ID VERIFICATION (AADHAAR / PAN) ────────────────────────────────────────
export const submitIdVerificationService = async (userId, { idType, idNumber, documentUrl }) => {
  if (!idType || !idNumber) throw new Error('ID type and number are required')

  let validationResult
  if (idType === 'aadhaar') {
    validationResult = validateAadhaar(idNumber)
  } else if (idType === 'pan') {
    validationResult = validatePAN(idNumber)
  } else {
    throw new Error('Invalid ID type')
  }

  if (!validationResult.valid) {
    throw new Error(validationResult.message)
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('profiles')
    .update({
      id_type: idType,
      id_number_masked: validationResult.masked,
      id_verification_status: 'verified', // Auto-verify on valid checksum
      id_verified_at: now,
      bio: documentUrl ? `Verified with ${idType.toUpperCase()} document (${documentUrl.split('/').pop()})` : undefined
    })
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// ── 3. BLACKLIST MANAGEMENT ───────────────────────────────────────────────────
export const blacklistUserService = async (userId, reason, riskLevel = 'high', adminId = null) => {
  // 1. Insert into blacklisted_users table
  const { error: insertErr } = await supabase
    .from('blacklisted_users')
    .insert({
      user_id: userId,
      reason,
      risk_level: riskLevel,
      blacklisted_by: adminId
    })

  if (insertErr) console.warn('Could not insert blacklisted_users record:', insertErr)

  // 2. Update profile table
  const { data, error } = await supabase
    .from('profiles')
    .update({
      is_blacklisted: true,
      blacklist_reason: reason,
      blacklist_updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

export const unblacklistUserService = async (userId) => {
  // 1. Delete from blacklisted_users table
  await supabase
    .from('blacklisted_users')
    .delete()
    .eq('user_id', userId)

  // 2. Update profile
  const { data, error } = await supabase
    .from('profiles')
    .update({
      is_blacklisted: false,
      blacklist_reason: null,
      blacklist_updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

export const getBlacklistedUsersService = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_blacklisted, blacklist_reason, blacklist_updated_at, created_at')
    .eq('is_blacklisted', true)

  if (error) throw error
  return data || []
}

// ── 4. FRAUD ALERTS MANAGEMENT ────────────────────────────────────────────────
export const createFraudAlertService = async ({ userId, entityType, entityId, riskLevel, flagType, description, metadata }) => {
  const { data, error } = await supabase
    .from('fraud_alerts')
    .insert({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      risk_level: riskLevel,
      flag_type: flagType,
      description,
      metadata: metadata || {}
    })
    .select()
    .maybeSingle()

  if (error) console.warn('Fraud alert creation warning:', error)
  return data
}

export const getFraudAlertsService = async () => {
  const { data, error } = await supabase
    .from('fraud_alerts')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('Error fetching fraud_alerts from DB, returning empty list:', error)
    return []
  }
  return data || []
}

export const updateFraudAlertStatusService = async (alertId, newStatus) => {
  const { data, error } = await supabase
    .from('fraud_alerts')
    .update({ status: newStatus })
    .eq('id', alertId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}
