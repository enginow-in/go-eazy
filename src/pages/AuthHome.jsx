import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Home, GraduationCap, Utensils, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordStrengthIndicator } from '../components/ui/PasswordStrengthIndicator'
import { EmailVerificationStatus } from '../components/auth/EmailVerificationStatus'
import { useAuth } from '../hooks/useAuth'
import { ForgotPassword } from '../components/auth/ForgotPassword'
import { validateSignupForm, validateLoginForm } from '../utils/validation'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

const ROLE_OPTIONS = [
  { value: 'user',             label: 'Student / Professional', icon: <GraduationCap size={20} className="text-brand-500" />, desc: 'Find PGs, Hostels & Flats' },
  { value: 'landlord',         label: 'Landlord / Owner',        icon: <Home size={20} className="text-brand-500" />, desc: 'List & Manage Properties' },
  { value: 'service_provider', label: 'Service Provider 🍱',    icon: <Utensils size={20} className="text-brand-500" />, desc: 'Offer Tiffin or Laundry' },
]

export const AuthHome = () => {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithGoogle, resendVerification } = useAuth()

  const [tab, setTab] = useState('login')
  const [view, setView] = useState('auth') // 'auth', 'forgot-password'
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [selectedRole, setSelectedRole] = useState('user')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})

  const waitForSession = async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.user) return true
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return false
  }

  const validate = () => {
    if (tab === 'login') {
      const validation = validateLoginForm({ email: form.email, password: form.password })
      setErrors(validation.errors)
      return validation.isValid
    } else {
      const validation = validateSignupForm({ 
        name: form.name, 
        email: form.email, 
        password: form.password, 
        role: selectedRole 
      })
      setErrors(validation.errors)
      return validation.isValid
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (tab === 'login') {
        const result = await signIn({ email: form.email, password: form.password })
        if (result?.user) {
          toast.success('Welcome back!')
          await waitForSession()
          navigate('/dashboard')
        }
      } else {
        const result = await signUp({ email: form.email, password: form.password, name: form.name, role: selectedRole })
        if (result?.user) {
          toast.success('Account created!')
          await waitForSession()
          navigate('/dashboard')
        }
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

  const resetForm = () => {
    setView('auth')
    setForm({ name: '', email: '', password: '' })
    setErrors({})
    setPendingVerificationEmail('')
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white relative overflow-hidden">
      
      {/* Decorative blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-50 z-0 animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-red-50 rounded-full blur-3xl opacity-30 z-0" />

      {/* Hero Content Section */}
      <div className="md:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#CA3433] rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Sparkles size={20} className="text-white fill-current" />
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tighter">GoEazy<span className="text-[#CA3433]">.</span></span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[0.9] tracking-tighter mb-6">
            Everything you need for <span className="text-[#CA3433] italic">Easy</span> living.
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-md leading-relaxed">
            Simplifying your hunt for PGs, hostles, and service providers in your city. One account, endless ease.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
            <CheckCircle2 size={18} className="text-green-500" />
            Verified High-Quality Listings
          </div>
          <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
            <CheckCircle2 size={18} className="text-green-500" />
            Direct Owner & Service Contact
          </div>
          <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
            <CheckCircle2 size={18} className="text-green-500" />
            Zero Commission Architecture
          </div>
        </motion.div>
      </div>

      {/* Auth Form Section */}
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-gray-50/30 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[480px] bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-[0_24px_80px_rgba(0,0,0,0.06)] border border-gray-100"
        >
          
          {view === 'forgot-password' && (
            <ForgotPassword onBack={() => setView('auth')} />
          )}

          {view === 'verification-sent' && (
            <EmailVerificationStatus
              email={pendingVerificationEmail}
              onResend={() => resendVerification(pendingVerificationEmail)}
              onBack={resetForm}
              type="signup"
            />
          )}

          {view === 'verification-reminder' && (
            <EmailVerificationStatus
              email={pendingVerificationEmail}
              onResend={() => resendVerification(pendingVerificationEmail)}
              onBack={resetForm}
              type="signup"
              title="Email Verification Required"
              description={`Please verify your email address before logging in. We've sent a verification link to ${pendingVerificationEmail}.`}
            />
          )}

          {view === 'auth' && (
            <>
              {/* Form Tabs */}
              <div className="flex gap-2 p-1 bg-gray-100/80 rounded-2xl mb-10">
                {['login', 'signup'].map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setErrors({}) }}
                    className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${
                      tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-white/50'
                    }`}
                  >
                    {t === 'login' ? 'Sign In' : 'Join Now'}
                  </button>
                ))}
              </div>

              <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                {tab === 'login' ? 'Welcome Back!' : 'Create your journey'}
              </h2>
              <p className="text-gray-400 font-medium mb-8">
                {tab === 'login' ? 'Continue with your credentials.' : 'Fill the details below to get started.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {tab === 'signup' && (
                      <Input
                        label="Full Name"
                        placeholder="e.g. Priyanshu Negi"
                        leftIcon={<User size={18} />}
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        error={errors.name}
                      />
                    )}

                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@email.com"
                      leftIcon={<Mail size={18} />}
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      error={errors.email}
                    />

                    <div className="space-y-2">
                      <Input
                        label="Password"
                        type={showPass ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        leftIcon={<Lock size={18} />}
                        rightIcon={
                          <button type="button" onClick={() => setShowPass(!showPass)}>
                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        }
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        error={errors.password}
                      />
                      
                      {/* Password Strength Indicator for Signup */}
                      {tab === 'signup' && form.password && (
                        <div className="px-1">
                          <PasswordStrengthIndicator password={form.password} showDetails={true} />
                        </div>
                      )}
                      
                      {/* Forgot Password Link */}
                      {tab === 'login' && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => setView('forgot-password')}
                            className="text-sm text-[#CA3433] hover:text-red-600 font-medium"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}
                    </div>

                    {tab === 'signup' && (
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Join GoEazy as</p>
                        <div className="grid grid-cols-1 gap-3">
                          {ROLE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setSelectedRole(opt.value)}
                              className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                                selectedRole === opt.value ? 'border-[#CA3433] bg-red-50/50' : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === opt.value ? 'bg-[#CA3433] text-white' : 'bg-gray-50 text-gray-400'}`}>
                                {opt.icon}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-gray-900">{opt.label}</h4>
                                <p className="text-[10px] text-gray-400 font-medium">{opt.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <Button type="submit" variant="primary" size="lg" className="w-full py-6 rounded-2xl bg-[#CA3433] shadow-xl shadow-red-500/20 text-lg group" loading={loading}>
                  <span className="flex items-center justify-center gap-2">
                    {tab === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </form>

              <div className="relative flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full py-4 rounded-2xl border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-3 font-bold"
                loading={googleLoading}
                onClick={handleGoogle}
              >
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
