import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import toast from 'react-hot-toast'
import { Link } from "react-router-dom";

const ROLE_OPTIONS = [
  { value: 'user',             label: 'Tenant',           emoji: '🎓' },
  { value: 'landlord',         label: 'Landlord',         emoji: '🏠' },
  { value: 'service_provider', label: 'Service Provider', emoji: '🍱' },
]

export const AuthGateModal = () => {
  const { user, signIn, signUp, signInWithGoogle } = useAuth()
  const { loading } = useSelector(s => s.auth)

  const [tab, setTab] = useState('login')
  const [formLoading, setFormLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [selectedRole, setSelectedRole] = useState('user')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})

  if (user || loading) return null

  const validate = () => {
    const e = {}
    if (tab === 'signup' && !form.name.trim()) e.name = 'Name required'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required'
    if (form.password.length < 8) e.password = 'Min 8 characters'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setFormLoading(true)
    try {
      if (tab === 'login') {
        await signIn({ email: form.email, password: form.password })
        toast.success('Welcome back!')
      } else {
        await signUp({ email: form.email, password: form.password, name: form.name, role: selectedRole })
        toast.success('Account created!')
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setFormLoading(false)
    }
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
            <span className="ml-auto text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">Members Only</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg mb-4">
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}) }}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-2.5"
              >
                {tab === 'signup' && (
                  <Input
                    placeholder="Full Name"
                    leftIcon={<User size={13} />}
                    value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(v => ({ ...v, name: '' })) }}
                    error={errors.name}
                    className="text-sm py-2"
                  />
                )}

                <Input
                  type="email"
                  placeholder="Email address"
                  leftIcon={<Mail size={13} />}
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(v => ({ ...v, email: '' })) }}
                  error={errors.email}
                  className="text-sm py-2"
                />

                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password (min 8 chars)"
                  leftIcon={<Lock size={13} />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPass(!showPass)} className="cursor-pointer text-gray-400">
                      {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  }
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(v => ({ ...v, password: '' })) }}
                  error={errors.password}
                  className="text-sm py-2"
                />

                {/* Role Selector — compact pill row for signup */}
                {tab === 'signup' && (
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">I am a...</p>
                    <div className="flex gap-1.5">
                      {ROLE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSelectedRole(opt.value)}
                          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg border-2 text-center transition-all ${
                            selectedRole === opt.value
                              ? 'border-[#CA3433] bg-red-50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <span className="text-base leading-none">{opt.emoji}</span>
                          <span className={`text-[9px] font-bold leading-tight ${selectedRole === opt.value ? 'text-[#CA3433]' : 'text-gray-500'}`}>
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-3 bg-[#CA3433] shadow-lg shadow-red-500/20 rounded-lg py-2.5 text-sm font-bold group"
              loading={formLoading}
            >
              <span className="flex items-center justify-center gap-1.5">
                {tab === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#CA3433] rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            Continue with Google
          </button>

         <p className="text-center text-[10px] text-gray-400 mt-3 leading-relaxed">
            By continuing, you agree to our{" "}
            <Link
              to="/terms"
              className="text-[#CA3433] font-semibold hover:underline"
            >
              Terms
            </Link>{" "}
            &{" "}
            <Link
              to="/privacy"
              className="text-[#CA3433] font-semibold hover:underline"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
