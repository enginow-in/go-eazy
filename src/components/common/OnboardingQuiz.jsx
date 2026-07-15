import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight, User, Briefcase, 
  Home, Building2, School, Hotel,
  Check, Sparkles, MapPin, IndianRupee
} from 'lucide-react'
import { PROPERTY_TYPES, CITIES } from '../../utils/constants'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { logger } from '../../utils/logger'

const QUIZ_STEPS = [
  {
    id: 'persona',
    title: 'Welcome to GoEazy!',
    subtitle: 'Who are you?',
    options: [
      { id: 'student', label: 'Student', icon: School, desc: 'Looking for budget-friendly PGs or Hostels near campus.' },
      { id: 'professional', label: 'Professional', icon: Briefcase, desc: 'Searching for peaceful flats or rooms near work.' }
    ]
  },
  {
    id: 'type',
    title: 'Your Vibe',
    subtitle: 'What kind of stay do you prefer?',
    options: PROPERTY_TYPES.map(t => ({ 
      id: t, 
      label: t, 
      icon: t === 'Room' ? Home : t === 'Flat' ? Building2 : t === 'Hostel' ? Hotel : User 
    }))
  },
  {
    id: 'city',
    title: 'The Where',
    subtitle: 'Which city are you moving to?',
    cities: CITIES
  },
  {
    id: 'budget',
    title: 'The Budget',
    subtitle: 'What is your monthly budget?',
    ranges: [
      { id: 'budget', label: 'Budget Friendly', range: [0, 8000], desc: 'Below ₹8,000' },
      { id: 'mid', label: 'Mid-Range', range: [8000, 15000], desc: '₹8,000 - ₹15,000' },
      { id: 'premium', label: 'Premium', range: [15000, 25000], desc: '₹15,000 - ₹25,000' },
      { id: 'luxury', label: 'Luxury', range: [25000, 100000], desc: '₹25,000+' }
    ]
  }
]

export const OnboardingQuiz = () => {
  const { user, profile, updateProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [selections, setSelections] = useState({
    persona: '',
    type: '',
    city: '',
    budget: null
  })

  // Open quiz only for Tenant (role='user') who haven't completed onboarding
  useEffect(() => {
    const isNewTenantUser = user && profile && profile.role === 'user' && !profile.onboarding_data
    if (isNewTenantUser) {
      setStep(0)
      setSelections({ persona: '', type: '', city: '', budget: null })
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [user, profile])

  // Listen for manual reset (from Search page Reset button)
  useEffect(() => {
    const handleReset = () => {
      setStep(0)
      setSelections({ persona: '', type: '', city: '', budget: null })
      setIsOpen(true)
    }
    window.addEventListener('goeazy_quiz_reset', handleReset)
    return () => window.removeEventListener('goeazy_quiz_reset', handleReset)
  }, [])

  const handleNext = () => {
    if (step < QUIZ_STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = async () => {
    setSaving(true)
    try {
      await updateProfile({ onboarding_data: selections })
      setIsOpen(false)
      window.dispatchEvent(new Event('goeazy_recommendations_updated'))
      toast.success('Preferences saved! Here are your matches. 🎯')
    } catch (err) {
      logger.error(err)
      toast.error('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const currentStep = QUIZ_STEPS[step]

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop — non-clickable, mandatory */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-lg"
      />

      {/* Quiz Card */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-0.5 bg-gray-100">
          {QUIZ_STEPS.map((_, i) => (
            <motion.div 
              key={i} 
              className="h-full bg-[#CA3433]"
              initial={{ width: 0 }}
              animate={{ width: i <= step ? `${100 / QUIZ_STEPS.length}%` : 0 }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>

        <div className="p-8 sm:p-10 pt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#CA3433] text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles size={11} /> Step {step + 1} of {QUIZ_STEPS.length}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight pt-1">{currentStep.title}</h2>
                <p className="text-gray-500 font-medium text-sm">{currentStep.subtitle}</p>
              </div>

              {/* Persona Step */}
              {currentStep.id === 'persona' && (
                <div className="grid grid-cols-1 gap-3">
                  {currentStep.options.map(opt => {
                    const Icon = opt.icon
                    const active = selections.persona === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelections(s => ({ ...s, persona: opt.id }))}
                        className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${active ? 'border-[#CA3433] bg-red-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${active ? 'bg-[#CA3433] text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                          <Icon size={22} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold ${active ? 'text-[#CA3433]' : 'text-gray-900'}`}>{opt.label}</h4>
                          <p className="text-xs text-gray-400">{opt.desc}</p>
                        </div>
                        {active && <Check size={18} className="text-[#CA3433]" />}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Property Type */}
              {currentStep.id === 'type' && (
                <div className="grid grid-cols-2 gap-3">
                  {currentStep.options.map(opt => {
                    const Icon = opt.icon
                    const active = selections.type === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelections(s => ({ ...s, type: opt.id }))}
                        className={`flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all ${active ? 'border-[#CA3433] bg-red-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-[#CA3433] text-white' : 'bg-gray-50 text-gray-400'}`}>
                          <Icon size={20} />
                        </div>
                        <h4 className={`font-bold text-sm ${active ? 'text-[#CA3433]' : 'text-gray-900'}`}>{opt.label}</h4>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* City */}
              {currentStep.id === 'city' && (
                <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {currentStep.cities.map(city => {
                    const active = selections.city === city
                    return (
                      <button
                        key={city}
                        onClick={() => setSelections(s => ({ ...s, city }))}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${active ? 'border-[#CA3433] bg-red-50 text-[#CA3433]' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}
                      >
                        <MapPin size={14} className={active ? 'text-[#CA3433]' : 'text-gray-300'} />
                        {city}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Budget */}
              {currentStep.id === 'budget' && (
                <div className="space-y-2.5">
                  {currentStep.ranges.map(r => {
                    const active = selections.budget?.id === r.id
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelections(s => ({ ...s, budget: r }))}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${active ? 'border-[#CA3433] bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className="flex items-center gap-3">
                          <IndianRupee size={15} className={active ? 'text-[#CA3433]' : 'text-gray-400'} />
                          <div className="text-left">
                            <p className={`text-sm font-bold ${active ? 'text-gray-900' : 'text-gray-600'}`}>{r.label}</p>
                            <p className="text-[10px] text-gray-400">{r.desc}</p>
                          </div>
                        </div>
                        {active && <div className="w-5 h-5 rounded-full bg-[#CA3433] flex items-center justify-center"><Check size={11} className="text-white" /></div>}
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {step + 1} / {QUIZ_STEPS.length} — {Math.round(((step + 1) / QUIZ_STEPS.length) * 100)}% done
            </p>
            <Button 
              disabled={!selections[currentStep.id] || saving}
              onClick={handleNext}
              variant="primary" 
              className="rounded-full px-7 py-2.5 bg-[#CA3433] hover:bg-[#ac2d2c] shadow-lg shadow-red-500/20 group"
              loading={saving && step === QUIZ_STEPS.length - 1}
            >
              <span className="flex items-center gap-2 text-sm">
                {step === QUIZ_STEPS.length - 1 ? 'Find My Match' : 'Next'}
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
