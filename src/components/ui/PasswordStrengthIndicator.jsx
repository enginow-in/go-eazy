import { useMemo } from 'react'
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'
import { calculatePasswordStrength, getPasswordStrengthInfo } from '../../utils/validation'

export const PasswordStrengthIndicator = ({ password, showDetails = false }) => {
  const strength = useMemo(() => calculatePasswordStrength(password || ''), [password])
  const strengthInfo = useMemo(() => getPasswordStrengthInfo(strength), [strength])
  
  if (!password) return null
  
  const getStrengthIcon = () => {
    if (strength < 30) return <ShieldX className="w-4 h-4" />
    if (strength < 60) return <ShieldAlert className="w-4 h-4" />
    if (strength < 80) return <Shield className="w-4 h-4" />
    return <ShieldCheck className="w-4 h-4" />
  }
  
  const getRequirements = () => [
    { test: password.length >= 8, label: 'At least 8 characters' },
    { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { test: /[a-z]/.test(password), label: 'One lowercase letter' },
    { test: /\d/.test(password), label: 'One number' },
    { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password), label: 'One special character' }
  ]
  
  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${strengthInfo.bgColor}`}
            style={{ width: `${strength}%` }}
          />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${strengthInfo.color}`}>
          {getStrengthIcon()}
          {strengthInfo.label}
        </div>
      </div>
      
      {/* Requirements Checklist */}
      {showDetails && (
        <div className="space-y-1">
          {getRequirements().map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                req.test ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {req.test ? '✓' : '○'}
              </div>
              <span className={req.test ? 'text-green-600' : 'text-gray-500'}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}