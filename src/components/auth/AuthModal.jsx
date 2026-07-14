import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Home, GraduationCap, Utensils, ShieldAlert, Clock } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { closeAuthModal } from '../../store/authSlice'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const ROLE_OPTIONS = [
  { value: 'user',             label: 'Student / Professional', icon: <GraduationCap size={20} className="text-brand-500" /> },
  { value: 'landlord',         label: 'Landlord / Owner',        icon: <Home size={20} className="text-brand-500" /> },
  { value: 'service_provider', label: 'Service Provider 🍱',    icon: <Utensils size={20} className="text-brand-500" /> },
]

export const AuthModal = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { authModalOpen, authModalTab, loginLockout } = useSelector(s => s.auth)
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const [tab, setTab] = useState(authModalTab)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [selectedRole, setSelectedRole] = useState('user')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef(null)

  React.useEffect(() => { setTab(authModalTab) }, [authModalTab])

  // Sync countdown from Redux lockout state
  useEffect(() => {
    if (loginLockout.locked && loginLockout.secondsRemaining > 0) {
      setCountdown(loginLockout.secondsRemaining)
      clearInterval(countdownRef.current)
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(countdownRef.current); return 0 }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(countdownRef.current)
      setCountdown(0)
    }
    return () => clearInterval(countdownRef.current)
  }, [loginLockout.locked, loginLockout.secondsRemaining])

  const isLocked = loginLockout.locked && countdown > 0
  const warnAttempts = !isLocked && loginLockout.attemptsRemaining <= 2 && loginLockout.attemptsRemaining > 0

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
    if (isLocked) return
    if (!validate()) return
    setLoading(true)
    try {
      if (tab === 'login') {
        await signIn({ email: form.email, password: form.password })
        toast.success('Welcome back!')
        dispatch(closeAuthModal())
        
        const returnTo = localStorage.getItem('sb_return_to')
        if (returnTo) {
          navigate(returnTo)
          localStorage.removeItem('sb_return_to')
        }
      } else {
        await signUp({ email: form.email, password: form.password, name: form.name, role: selectedRole })
        toast.success('Account created! Check your email to confirm.')
        const returnTo = localStorage.getItem('sb_return_to')
        dispatch(closeAuthModal())
        if (selectedRole === 'landlord') {
          navigate('/landlord')
        } else if (selectedRole === 'service_provider') {
          navigate('/service-provider')
        } else if (returnTo) {
          navigate(returnTo)
          localStorage.removeItem('sb_return_to')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
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
    <Modal open={authModalOpen} onClose={() => dispatch(closeAuthModal())} size="sm">
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

      {/* Lockout Banner */}
      {tab === 'login' && isLocked && (
        <div className="flex items-start gap-3 p-3 mb-4 rounded-xl bg-red-50 border border-red-200">
          <ShieldAlert size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700">Account temporarily locked</p>
            <p className="text-xs text-red-600 mt-0.5">
              Too many failed attempts. Try again in{' '}
              <span className="font-mono font-bold inline-flex items-center gap-1">
                <Clock size={11} />
                {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Remaining Attempts Warning */}
      {tab === 'login' && warnAttempts && (
        <div className="flex items-center gap-2 p-2.5 mb-4 rounded-lg bg-amber-50 border border-amber-200">
          <ShieldAlert size={15} className="text-amber-500 shrink-0" />
          <p className="text-xs font-semibold text-amber-700">
            Warning: {loginLockout.attemptsRemaining} attempt{loginLockout.attemptsRemaining !== 1 ? 's' : ''} remaining before lockout
          </p>
        </div>
      )}

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

        <Button type="submit" variant="primary" size="lg"
          className="w-full shadow-lg shadow-[#CA3433]/20"
          loading={loading}
          disabled={isLocked}
        >
          {isLocked
            ? `Locked · ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
            : tab === 'login' ? 'Sign In' : 'Create Account'
          }
        </Button>
      </form>

    </Modal>
  )
}
