import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export const ResetPassword = () => {
  const navigate = useNavigate()
  const { user, updatePassword, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  // If user landed here without a valid recovery session, redirect away
  useEffect(() => {
    // Supabase auto-detects the recovery token from the URL hash
    // and logs the user in. If there's no user after a short delay,
    // it means the token was invalid or expired.
    const timeout = setTimeout(() => {
      if (!user) {
        toast.error('Invalid or expired reset link. Please try again.')
        navigate('/search')
      }
    }, 3000)

    return () => clearTimeout(timeout)
  }, [user, navigate])

  const validate = () => {
    const e = {}
    if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await updatePassword(password)
      await signOut()
      setSuccess(true)
      toast.success('Password updated! Please sign in with your new password.')
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
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

        <div className="px-6 pt-5 pb-6">
          {/* Logo row */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-[#CA3433] shadow-md flex items-center justify-center font-bold rotate-3 overflow-hidden">
              <div className="-rotate-3 flex items-center justify-center translate-y-0.5">
                <span className="text-[#CA3433] text-[16px] font-black leading-none">G</span>
                <span className="text-[#CA3433] text-[11px] font-black leading-none -ml-0.5 mb-1.5">E</span>
              </div>
            </div>
            <span className="text-base font-black text-gray-900 tracking-tight">GoEazy<span className="text-[#CA3433]">.</span></span>
            <span className="ml-auto text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">
              {success ? 'Done' : 'New Password'}
            </span>
          </div>

          {!success ? (
            <>
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={24} className="text-[#CA3433]" />
              </div>

              <div className="text-center mb-5">
                <h1 className="text-lg font-black text-gray-900 mb-1">Set New Password</h1>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Choose a strong password with at least 8 characters.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder="New password (min 8 chars)"
                  leftIcon={<Lock size={13} />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPass(!showPass)} className="cursor-pointer text-gray-400">
                      {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  }
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: '' })) }}
                  error={errors.password}
                  className="text-sm py-2"
                  autoFocus
                />

                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  leftIcon={<Lock size={13} />}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(v => ({ ...v, confirmPassword: '' })) }}
                  error={errors.confirmPassword}
                  className="text-sm py-2"
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full bg-[#CA3433] shadow-lg shadow-red-500/20 rounded-lg py-2.5 text-sm font-bold"
                  loading={loading}
                >
                  Update Password
                </Button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-1.5">Password Updated!</h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2 mb-5">
                Your password has been changed successfully. Please sign in with your new password.
              </p>
              <Button
                variant="primary"
                className="w-full bg-[#CA3433] shadow-lg shadow-red-500/20 rounded-lg py-2.5 text-sm font-bold"
                onClick={() => navigate('/search')}
              >
                Sign In
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
