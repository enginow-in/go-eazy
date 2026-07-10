import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import toast from 'react-hot-toast'

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

          <p className="text-center text-[10px] text-gray-400 mt-3 leading-relaxed">
            By continuing, you agree to our <span className="text-[#CA3433] font-semibold">Terms</span> & <span className="text-[#CA3433] font-semibold">Privacy Policy</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
