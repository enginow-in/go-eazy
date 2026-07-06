import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

import { supabase } from '../lib/supabase'
import { openAuthModal } from '../store/authSlice'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const MIN_PASSWORD_LENGTH = 8

export const ResetPassword = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})

  const { user, loading } = useSelector(s => s.auth)

  const hasRecoveryToken = useMemo(() => {
    if (typeof window === 'undefined') return false
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const queryParams = new URLSearchParams(window.location.search)

    const hashType = hashParams.get('type')
    const queryType = queryParams.get('type')
    const hasRecoveryType = hashType === 'recovery' || queryType === 'recovery'

    const tokenExists =
      hashParams.has('access_token') ||
      hashParams.has('refresh_token') ||
      queryParams.has('token_hash') ||
      queryParams.has('code')

    return hasRecoveryType && tokenExists
  }, [])

  useEffect(() => {
    // Wait until auth loading is finished
    if (loading) return
    // If the user is logged in, they can reset their password
    if (user) return
    // If they aren't logged in, but the URL still has the token, wait for Supabase to process it
    if (hasRecoveryToken) return

    toast.error('Reset link is invalid or expired. Please request a new one.')
    dispatch(openAuthModal('forgot_password'))
    navigate('/search', { replace: true })
  }, [dispatch, hasRecoveryToken, navigate, user, loading])

  const validate = () => {
    const nextErrors = {}

    if (!form.password || form.password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    }

    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validate()) return

    if (!user && !hasRecoveryToken) {
      toast.error('You must be logged in to reset your password. Please request a new reset link if yours expired.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password })
      if (error) throw error

      toast.success('Password updated successfully. Please sign in with your new password.')
      dispatch(openAuthModal('login'))
      navigate('/search', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to reset password. Please request a new reset link.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter a strong password and confirm it to finish recovering your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            id="reset-password"
            name="password"
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Min 8 characters"
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            value={form.password}
            onChange={(event) => {
              setForm(prev => ({ ...prev, password: event.target.value }))
              setErrors(prev => ({ ...prev, password: '', confirmPassword: '' }))
            }}
            error={errors.password}
          />

          <Input
            id="reset-confirm-password"
            name="confirmPassword"
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter new password"
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                className="cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            value={form.confirmPassword}
            onChange={(event) => {
              setForm(prev => ({ ...prev, confirmPassword: event.target.value }))
              setErrors(prev => ({ ...prev, confirmPassword: '' }))
            }}
            error={errors.confirmPassword}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
            Update Password
          </Button>

          <button
            type="button"
            className="w-full text-sm font-semibold text-gray-500 hover:text-gray-700"
            onClick={() => {
              dispatch(openAuthModal('login'))
              navigate('/search', { replace: true })
            }}
          >
            Back to Sign In
          </button>
        </form>
      </div>
    </section>
  )
}
