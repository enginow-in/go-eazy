import React from 'react'
import { Check, X } from 'lucide-react'
import { motion } from 'framer-motion'

export const getPasswordRequirements = (password = '') => {
  return [
    { key: 'length', label: 'Minimum 8 characters', met: password.length >= 8 },
    { key: 'uppercase', label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { key: 'lowercase', label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { key: 'number', label: 'At least one number (0-9)', met: /[0-9]/.test(password) },
    { key: 'special', label: 'At least one special character (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(password) }
  ]
}

export const getPasswordStrength = (password = '') => {
  const reqs = getPasswordRequirements(password)
  const metCount = reqs.filter(r => r.met).length
  
  if (!password) return { score: 0, label: '', color: 'bg-gray-200', textColor: 'text-gray-400' }
  if (metCount <= 1) return { score: 1, label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-500' }
  if (metCount === 2) return { score: 2, label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-500' }
  if (metCount === 3) return { score: 3, label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500' }
  if (metCount === 4) return { score: 4, label: 'Strong', color: 'bg-emerald-400', textColor: 'text-emerald-400' }
  return { score: 5, label: 'Very Strong', color: 'bg-emerald-600', textColor: 'text-emerald-600' }
}

export const PasswordStrengthIndicator = ({ password = '' }) => {
  const requirements = getPasswordRequirements(password)
  const { score, label, color, textColor } = getPasswordStrength(password)

  return (
    <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Strength bar & label */}
      {password && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-gray-400 uppercase tracking-wider">Password Strength</span>
            <span className={`uppercase tracking-wider ${textColor}`}>{label}</span>
          </div>
          
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
            {[1, 2, 3, 4, 5].map(step => (
              <div 
                key={step} 
                className={`h-full flex-1 transition-all duration-300 ${step <= score ? color : 'bg-gray-100'}`} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
        {requirements.map(req => (
          <div key={req.key} className="flex items-center gap-2 text-xs font-semibold">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${req.met ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              {req.met ? <Check size={10} className="stroke-[3]" /> : <div className="w-1 h-1 bg-gray-300 rounded-full" />}
            </div>
            <span className={`transition-colors ${req.met ? 'text-gray-900' : 'text-gray-400 font-medium'}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
