import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setFraudAlerts,
  addFraudAlert,
  updateFraudAlertStatus,
  setBlacklistedUsers,
  addBlacklistedUser,
  removeBlacklistedUser,
  setPhoneModalOpen,
  setIdModalOpen,
  setSafetyStats,
  setLoading
} from '../store/fraudSlice'
import { setProfile } from '../store/authSlice'
import {
  sendPhoneOtpService,
  verifyPhoneOtpService,
  submitIdVerificationService,
  blacklistUserService,
  unblacklistUserService,
  getBlacklistedUsersService,
  createFraudAlertService,
  getFraudAlertsService,
  updateFraudAlertStatusService
} from '../services/fraudService'
import {
  detectListingSpam,
  checkPhotoAuthenticity,
  evaluateTransactionRisk
} from '../utils/fraudDetection'
import toast from 'react-hot-toast'

export const useFraudSafety = () => {
  const dispatch = useDispatch()
  const { user, profile } = useSelector(s => s.auth)
  const { listings } = useSelector(s => s.property)
  const {
    fraudAlerts,
    blacklistedUsers,
    phoneModalOpen,
    idModalOpen,
    safetyStats,
    loading
  } = useSelector(s => s.fraud)

  // ── Modal Controls ────────────────────────────────────────────────────────
  const openPhoneModal = useCallback(() => dispatch(setPhoneModalOpen(true)), [dispatch])
  const closePhoneModal = useCallback(() => dispatch(setPhoneModalOpen(false)), [dispatch])
  const openIdModal = useCallback(() => dispatch(setIdModalOpen(true)), [dispatch])
  const closeIdModal = useCallback(() => dispatch(setIdModalOpen(false)), [dispatch])

  // ── Phone OTP Operations ──────────────────────────────────────────────────
  const requestPhoneOtp = async (phoneNumber) => {
    dispatch(setLoading(true))
    try {
      const res = await sendPhoneOtpService(phoneNumber)
      toast.success(res.message, { duration: 5000 })
      return res
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP')
      throw err
    } finally {
      dispatch(setLoading(false))
    }
  }

  const verifyPhoneOtp = async (phoneNumber, code) => {
    if (!user) throw new Error('Must be signed in to verify phone')
    dispatch(setLoading(true))
    try {
      const updatedProfile = await verifyPhoneOtpService(user.id, phoneNumber, code)
      dispatch(setProfile(updatedProfile))
      dispatch(setPhoneModalOpen(false))
      toast.success('Phone number verified successfully! 📱')
      return updatedProfile
    } catch (err) {
      toast.error(err.message || 'OTP verification failed')
      throw err
    } finally {
      dispatch(setLoading(false))
    }
  }

  // ── ID Verification Operations (Aadhaar / PAN) ────────────────────────────
  const submitIDVerification = async ({ idType, idNumber, documentUrl }) => {
    if (!user) throw new Error('Must be signed in to submit ID')
    dispatch(setLoading(true))
    try {
      const updatedProfile = await submitIdVerificationService(user.id, { idType, idNumber, documentUrl })
      dispatch(setProfile(updatedProfile))
      dispatch(setIdModalOpen(false))
      toast.success(`${idType.toUpperCase()} verified successfully! 🛡️`)
      return updatedProfile
    } catch (err) {
      toast.error(err.message || 'ID verification failed')
      throw err
    } finally {
      dispatch(setLoading(false))
    }
  }

  // ── Automated Property Spam & Photo Authenticity Pre-check ────────────────
  const scanListingSafety = (propertyData, imageUrls = []) => {
    // 1. Check text & price spam
    const spamResult = detectListingSpam(propertyData, listings)

    // 2. Check photo authenticity
    const photoResult = checkPhotoAuthenticity(imageUrls, listings)

    // Combined risk calculation
    const overallRiskScore = Math.min(100, spamResult.spamScore + (photoResult.verified ? 0 : 35))
    const isHighRisk = overallRiskScore >= 50

    return {
      isSpam: spamResult.isSpam,
      spamStatus: spamResult.spamStatus,
      spamScore: spamResult.spamScore,
      spamFlags: spamResult.flags,
      photoStatus: photoResult.status,
      photoFlags: photoResult.flags,
      imageHashes: photoResult.imageHashes,
      overallRiskScore,
      isHighRisk
    }
  }

  // ── Transaction Risk Monitoring ───────────────────────────────────────────
  const evaluatePayment = async (amount, paymentType = 'listing_payment') => {
    const riskEval = evaluateTransactionRisk({
      amount,
      userId: user?.id,
      profile,
      userPaymentHistory: []
    })

    if (riskEval.requiresManualReview) {
      const alertItem = await createFraudAlertService({
        userId: user?.id,
        entityType: 'transaction',
        entityId: `tx_${Date.now()}`,
        riskLevel: riskEval.riskLevel,
        flagType: riskEval.flags[0] || 'suspicious_payment',
        description: `Payment attempt of ₹${amount} flagged for risk score ${riskEval.riskScore}`,
        metadata: { amount, paymentType, flags: riskEval.flags }
      })
      if (alertItem) dispatch(addFraudAlert(alertItem))
    }

    return riskEval
  }

  // ── Admin Fraud & Blacklist Operations ────────────────────────────────────
  const fetchAdminFraudData = useCallback(async () => {
    dispatch(setLoading(true))
    try {
      const [alerts, blacklists] = await Promise.all([
        getFraudAlertsService(),
        getBlacklistedUsersService()
      ])
      dispatch(setFraudAlerts(alerts))
      dispatch(setBlacklistedUsers(blacklists))
      dispatch(setSafetyStats({
        totalSpamFlagged: alerts.filter(a => a.entity_type === 'property').length,
        totalBlacklisted: blacklists.length,
        suspiciousTransactions: alerts.filter(a => a.entity_type === 'transaction').length,
        verifiedUsersCount: 0
      }))
    } catch (err) {
      console.error('Error fetching admin fraud data:', err)
    } finally {
      dispatch(setLoading(false))
    }
  }, [dispatch])

  const blacklistUser = async (targetUserId, reason, riskLevel = 'high') => {
    dispatch(setLoading(true))
    try {
      const updatedUser = await blacklistUserService(targetUserId, reason, riskLevel, user?.id)
      dispatch(addBlacklistedUser(updatedUser))
      toast.success('User added to blacklist')
      return updatedUser
    } catch (err) {
      toast.error('Failed to blacklist user: ' + err.message)
      throw err
    } finally {
      dispatch(setLoading(false))
    }
  }

  const unblacklistUser = async (targetUserId) => {
    dispatch(setLoading(true))
    try {
      await unblacklistUserService(targetUserId)
      dispatch(removeBlacklistedUser(targetUserId))
      toast.success('User removed from blacklist')
    } catch (err) {
      toast.error('Failed to remove from blacklist: ' + err.message)
      throw err
    } finally {
      dispatch(setLoading(false))
    }
  }

  const resolveAlert = async (alertId, newStatus) => {
    try {
      await updateFraudAlertStatusService(alertId, newStatus)
      dispatch(updateFraudAlertStatus({ id: alertId, status: newStatus }))
      toast.success(`Alert marked as ${newStatus}`)
    } catch (err) {
      toast.error('Failed to update alert: ' + err.message)
    }
  }

  return {
    fraudAlerts,
    blacklistedUsers,
    phoneModalOpen,
    idModalOpen,
    safetyStats,
    loading,
    openPhoneModal,
    closePhoneModal,
    openIdModal,
    closeIdModal,
    requestPhoneOtp,
    verifyPhoneOtp,
    submitIDVerification,
    scanListingSafety,
    evaluatePayment,
    fetchAdminFraudData,
    blacklistUser,
    unblacklistUser,
    resolveAlert
  }
}
