import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Home, GraduationCap, Utensils } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { closeAuthModal } from '../../store/authSlice'
import { useAuth } from '../../hooks/useAuth'
import { ForgotPassword } from './ForgotPassword'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

const ROLE_OPTIONS = [
  { value: 'user',             label: 'Student / Professional', icon: <GraduationCap size={20} className="text-brand-500" /> },
  { value: 'landlord',         label: 'Landlord / Owner',        icon: <Home size={20} className="text-brand-500" /> },
  { value: 'service_provider', label: 'Service Provider 🍱',    icon: <Utensils size={20} className="text-brand-500" /> },
]

export const AuthModal = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { authModalOpen, authModalTab } = useSelector(s => s.auth)
  const { signIn, signUp, signInWithGoogle, resendVerification } = useAuth()

  const [tab, setTab] = useState(authModalTab)
  const [view, setView] = useState('auth') // 'auth', 'forgot-password', 'resend-verification'
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [selectedRole, setSelectedRole] = useState('user')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('')

  const waitForSession = async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.user) return true
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return false
  }

  React.useEffect(() => { setTab(authModalTab) }, [authModalTab])

  const validate = () => {
    const e = {}
    if (tab === 'signup' && !form.name.trim()) e.name = 'Name is required'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required'
    if (form.password.length < 8) e.password = 'Min 8 characters'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (tab === 'login') {
        await signIn({ email: form.email, password: form.password })
        toast.success('Welcome back!')
        await waitForSession()
        dispatch(closeAuthModal())
        
        const returnTo = localStorage.getItem('sb_return_to')
        if (returnTo) {
          navigate(returnTo)
          localStorage.removeItem('sb_return_to')
        }
      } else {
        await signUp({ email: form.email, password: form.password, name: form.name, role: selectedRole })
        setPendingVerificationEmail(form.email)
        toast.success('Account created! Please check your email to verify your account.')
        // Don't close modal - show verification message instead
        setView('verification-sent')
      }
    } catch (err) {
      // Handle specific error messages
      if (err.message.includes('already exists')) {
        toast.error('An account with this email already exists. Please log in instead.')
        setTab('login')
      } else if (err.message.includes('No account found')) {
        toast.error('No account found with this email. Please sign up first.')
        setTab('signup')
      } else if (err.message.includes('verify your email')) {
        toast.error('Please verify your email before logging in.')
        setPendingVerificationEmail(form.email)
        setView('verification-reminder')
      } else {
        toast.error(err.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setLoading(true)
    try {
      await resendVerification(pendingVerificationEmail)
      toast.success('Verification email sent!')
    } catch (err) {
      toast.error(err.message || 'Failed to send verification email')
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setView('auth')
    setForm({ name: '', email: '', password: '' })
    setErrors({})
    setPendingVerificationEmail('')
  }

  const handleGoogle = async () => {
    // Save current path to return back after OAuth redirect
    localStorage.setItem('sb_return_to', window.location.pathname + window.location.search)
    
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed')
      setGoogleLoading(false)
    }
  }

  return (
    <Modal open={authModalOpen} onClose={() => {
      dispatch(closeAuthModal())
      resetModal()
    }} size="sm">
      
      {view === 'forgot-password' && (
        <ForgotPassword onBack={() => setView('auth')} />
      )}

      {view === 'verification-sent' && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">Check your email</h3>
          <p className="text-sm text-gray-600">
            We've sent a verification link to <strong>{pendingVerificationEmail}</strong>
          </p>
          <p className="text-xs text-gray-500">
            The link will expire in 1 hour. If you don't receive it, check your spam folder.
          </p>
          <div className="space-y-2">
            <Button
              onClick={handleResendVerification}
              loading={loading}
              variant="secondary"
              className="w-full"
            >
              Resend Verification Email
            </Button>
            <Button
              onClick={resetModal}
              variant="ghost"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      )}

      {view === 'verification-reminder' && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold">Email Verification Required</h3>
          <p className="text-sm text-gray-600">
            Please verify your email address before logging in. Check your inbox at <strong>{pendingVerificationEmail}</strong>
          </p>
          <div className="space-y-2">
            <Button
              onClick={handleResendVerification}
              loading={loading}
              className="w-full"
            >
              Resend Verification Email
            </Button>
            <Button
              onClick={resetModal}
              variant="secondary"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      )}

      {view === 'auth' && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}) }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <Button
            variant="secondary"
            size="lg"
            className="w-full mb-3"
            loading={googleLoading}
            onClick={handleGoogle}
            leftIcon={
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            }
          >
            Continue with Google
          </Button>

          <div className="relative flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <Input
                id="signup-name"
                name="name"
                label="Full Name"
                placeholder="Priya Sharma"
                leftIcon={<User size={16} />}
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(v => ({ ...v, name: '' })) }}
                error={errors.name}
                autoComplete="name"
              />
            )}

            <Input
              id={`${tab}-email`}
              name="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail size={16} />}
              value={form.email}
              onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(v => ({ ...v, email: '' })) }}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              id={`${tab}-password`}
              name="password"
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder={tab === 'signup' ? 'Min 8 characters' : '••••••••'}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPass(v => !v)} className="cursor-pointer">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              value={form.password}
              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(v => ({ ...v, password: '' })) }}
              error={errors.password}
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
            />

            {/* Forgot Password Link */}
            {tab === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setView('forgot-password')}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Role Selector (Sign Up only) */}
            {tab === 'signup' && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">I am a...</p>
                <div className="grid grid-cols-1 gap-2">
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedRole(opt.value)}
                      className={`px-4 py-2.5 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                        selectedRole === opt.value
                          ? 'border-[#CA3433] bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full shadow-lg shadow-[#CA3433]/20" loading={loading}>
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </>
      )}
    </Modal>
  )
}
