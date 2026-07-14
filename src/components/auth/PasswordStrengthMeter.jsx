import React from 'react'
import { Check, X } from 'lucide-react'
import { PASSWORD_RULES, evaluatePassword } from '../../utils/passwordStrength'

/**
 * Shows a live checklist of password requirements as the user types.
 * Renders nothing until the user has typed at least one character, so it
 * doesn't clutter an empty form.
 */
export const PasswordStrengthMeter = ({ password = '' }) => {
  if (!password) return null

  const { passed } = evaluatePassword(password)
  const strength = passed.length // 0-5

  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength]
  const strengthColor = [
    'bg-gray-300',
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
  ][strength]

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
          {PASSWORD_RULES.map((rule, i) => (
            <div
              key={rule.id}
              className={`flex-1 rounded-full transition-colors ${i < strength ? strengthColor : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-gray-500 shrink-0">{strengthLabel}</span>
      </div>

      {/* Requirement checklist */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {PASSWORD_RULES.map(rule => {
          const met = rule.test(password)
          return (
            <li key={rule.id} className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
              {met ? <Check size={12} className="shrink-0" /> : <X size={12} className="shrink-0" />}
              {rule.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}