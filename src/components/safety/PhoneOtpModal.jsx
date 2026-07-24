import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Smartphone, ShieldCheck, RefreshCw, KeyRound, AlertCircle } from 'lucide-react'
import { useFraudSafety } from '../../hooks/useFraudSafety'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

export const PhoneOtpModal = () => {
  const { profile } = useAuth()
  const { phoneModalOpen, closePhoneModal, requestPhoneOtp, verifyPhoneOtp, loading } = useFraudSafety()

  const [phone, setPhone] = useState('')
  const [step, setStep] = useState(1) // 1: Enter Phone, 2: Enter OTP
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(0)
  const [simulatedCode, setSimulatedCode] = useState('')

  useEffect(() => {
    if (phoneModalOpen) {
      setPhone(profile?.phone || '')
    }
  }, [phoneModalOpen, profile?.phone])

  useEffect(() => {
    let interval = null
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    try {
      const res = await requestPhoneOtp(cleanPhone)
      setSimulatedCode(res.simulatedOtp || '')
      setStep(2)
      setTimer(60)
    } catch {
      // error handled in hook
    }
  }

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return
    const newOtp = [...otpCode]
    newOtp[index] = value.slice(-1)
    setOtpCode(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const codeString = otpCode.join('')
    if (codeString.length < 6) {
      toast.error('Please enter the full 6-digit OTP code')
      return
    }

    try {
      await verifyPhoneOtp(phone, codeString)
      setStep(1)
      setOtpCode(['', '', '', '', '', ''])
    } catch {
      // error handled in hook
    }
  }

  const handleClose = () => {
    closePhoneModal()
    setStep(1)
    setOtpCode(['', '', '', '', '', ''])
  }

  return (
    <Modal open={phoneModalOpen} onClose={handleClose} size="md">
      <div className="p-4 sm:p-6 text-gray-900">
        
        {/* Header Icon */}
        <div className="w-16 h-16 bg-red-50 text-[#CA3433] rounded-2xl border border-red-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Smartphone size={32} />
        </div>

        <h2 className="text-2xl font-black text-center font-display mb-1">
          {step === 1 ? 'Verify Phone Number' : 'Enter Verification Code'}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
          {step === 1
            ? 'Add phone verification to protect your account, earn the Verified badge, and contact property owners directly.'
            : `Enter the 6-digit OTP code sent to ${phone}`}
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <Input
              id="phone-verification-input"
              label="Phone Number (10 digits)"
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-3.5 bg-[#CA3433] hover:bg-[#b02c2b] text-white font-bold rounded-xl shadow-sm"
            >
              {loading ? 'Sending OTP...' : 'Send OTP Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            
            {/* Demo Hint Banner */}
            {simulatedCode && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-800">
                <span className="flex items-center gap-1.5 font-bold">
                  <KeyRound size={16} className="text-amber-600" /> Demo OTP:
                </span>
                <span className="font-mono text-sm font-black bg-amber-200/60 px-2.5 py-0.5 rounded tracking-widest">{simulatedCode}</span>
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div className="flex justify-center gap-2 sm:gap-3">
              {otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold border-2 border-gray-200 rounded-xl focus:border-[#CA3433] focus:ring-0 focus:outline-none transition-all shadow-sm"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="hover:text-gray-900 font-bold underline underline-offset-2"
              >
                Change Number
              </button>
              
              {timer > 0 ? (
                <span>Resend in <strong className="text-gray-900">{timer}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-[#CA3433] font-bold flex items-center gap-1 hover:underline"
                >
                  <RefreshCw size={13} /> Resend OTP
                </button>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </form>
        )}

      </div>
    </Modal>
  )
}
