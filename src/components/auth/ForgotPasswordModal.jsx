import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import toast from 'react-hot-toast'

export const ForgotPasswordModal = ({ isOpen, onClose, onBackToLogin }) => {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  if (!isOpen) return null

  const validate = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSent(false)
    setEmail('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-sm mx-4 bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#CA3433] to-rose-400" />

        <div className="px-6 pt-5 pb-5">
          {/* Logo row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-[#CA3433] shadow-md flex items-center justify-center font-bold rotate-3 overflow-hidden">
              <div className="-rotate-3 flex items-center justify-center translate-y-0.5">
                <span className="text-[#CA3433] text-[16px] font-black leading-none">G</span>
                <span className="text-[#CA3433] text-[11px] font-black leading-none -ml-0.5 mb-1.5">E</span>
              </div>
            </div>
            <span className="text-base font-black text-gray-900 tracking-tight">GoEazy<span className="text-[#CA3433]">.</span></span>
            <span className="ml-auto text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">Password Reset</span>
          </div>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Enter your email and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Email address"
                    leftIcon={<Mail size={13} />}
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    error={error}
                    className="text-sm py-2"
                    autoFocus
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-[#CA3433] shadow-lg shadow-red-500/20 rounded-lg py-2.5 text-sm font-bold"
                    loading={loading}
                  >
                    Send Reset Link
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4"
              >
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} className="text-green-500" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-1.5">Check your email</h3>
                <p className="text-xs text-gray-500 leading-relaxed px-2 mb-4">
                  We've sent a password reset link to <span className="font-semibold text-gray-700">{email}</span>. 
                  Check your inbox and spam folder.
                </p>
                <button
                  onClick={handleClose}
                  className="text-sm font-bold text-[#CA3433] hover:underline"
                >
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!sent && (
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex items-center justify-center gap-1.5 w-full mt-3 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={12} />
              Back to Sign In
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
