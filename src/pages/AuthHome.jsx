import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Home, GraduationCap, Utensils, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const ROLE_OPTIONS = [
  { value: 'user',             label: 'Student / Professional', icon: <GraduationCap size={20} className="text-brand-500" />, desc: 'Find PGs, Hostels & Flats' },
  { value: 'landlord',         label: 'Landlord / Owner',        icon: <Home size={20} className="text-brand-500" />, desc: 'List & Manage Properties' },
  { value: 'service_provider', label: 'Service Provider 🍱',    icon: <Utensils size={20} className="text-brand-500" />, desc: 'Offer Tiffin or Laundry' },
]

export const AuthHome = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [selectedRole, setSelectedRole] = useState('user')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (tab === 'signup' && !form.name.trim()) e.name = 'Name is required'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required'
    if (form.password.length < 8) e.password = 'Min 8 characters'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (tab === 'login') {
        await signIn({ email: form.email, password: form.password })
        toast.success('Welcome back!')
        navigate('/search')
      } else {
        await signUp({ email: form.email, password: form.password, name: form.name, role: selectedRole })
        toast.success('Account created!')
        if (selectedRole === 'landlord') navigate('/landlord')
        else if (selectedRole === 'service_provider') navigate('/service-provider')
        else navigate('/search')
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
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


        </motion.div>
      </div>
    </div>
  )
}
