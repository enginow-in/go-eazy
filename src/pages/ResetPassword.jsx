import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter'
import { evaluatePassword, getPasswordErrorMessage } from '../utils/passwordStrength'
import { useAuth } from '../hooks/useAuth'

export const ResetPassword = () => {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const strengthError = getPasswordErrorMessage(password)
    if (strengthError) {
      setError(strengthError)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      toast.success('Password updated')
      setTimeout(() => navigate('/search'), 2000)
    } catch (err) {
      // Supabase returns an error here if the recovery link is missing/expired,
      // since no valid session exists to update.
      toast.error(err.message || 'Could not update password. Try requesting a new link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-gray-900 mb-1">Password updated</h1>
            <p className="text-sm text-gray-500">Redirecting you now...</p>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-bold text-gray-900 mb-1">Set a new password</h1>
            <p className="text-sm text-gray-500 mb-6">Choose a strong password for your account.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  id="new-password"
                  name="password"
                  label="New Password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  leftIcon={<Lock size={16} />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPass(v => !v)} className="cursor-pointer">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  autoComplete="new-password"
                />
                <PasswordStrengthMeter password={password} />
              </div>

              <Input
                id="confirm-password"
                name="confirmPassword"
                label="Confirm Password"
                type={showPass ? 'text' : 'password'}
                placeholder="Re-enter password"
                leftIcon={<Lock size={16} />}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                error={error}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full shadow-lg shadow-[#CA3433]/20"
                loading={loading}
                disabled={!evaluatePassword(password).isValid}
              >
                Update Password
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}