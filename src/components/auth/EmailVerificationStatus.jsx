import { useState, useEffect } from 'react'
import { Mail, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

export const EmailVerificationStatus = ({ 
  email, 
  onResend, 
  onBack, 
  type = 'signup', // 'signup' | 'password-reset'
  title,
  description
}) => {
  const { resendVerification } = useAuth()
  const [loading, setLoading] = useState(false)
  const [resendCount, setResendCount] = useState(0)
  const [canResend, setCanResend] = useState(true)
  const [cooldown, setCooldown] = useState(0)

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldown])

  const handleResend = async () => {
    if (!canResend) return
    
    setLoading(true)
    try {
      if (onResend) {
        await onResend()
      } else {
        await resendVerification(email)
      }
      
      setResendCount(prev => prev + 1)
      setCanResend(false)
      
      // Increase cooldown with each resend (30s, 60s, 120s, etc.)
      const newCooldown = Math.min(30 * Math.pow(2, resendCount), 300) // Max 5 minutes
      setCooldown(newCooldown)
      
      toast.success('Verification email sent!')
    } catch (error) {
      toast.error(error.message || 'Failed to send verification email')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (type === 'signup') {
      return <Mail className="w-12 h-12 text-blue-600" />
    } else if (type === 'password-reset') {
      return <Mail className="w-12 h-12 text-green-600" />
    }
    return <Mail className="w-12 h-12 text-blue-600" />
  }

  const getStatusColor = () => {
    if (type === 'password-reset') return 'bg-green-100'
    return 'bg-blue-100'
  }

  const defaultTitle = type === 'password-reset' 
    ? 'Check your email for reset link'
    : 'Verify your email address'

  const defaultDescription = type === 'password-reset'
    ? `We've sent a password reset link to ${email}. Click the link in the email to reset your password.`
    : `We've sent a verification link to ${email}. Click the link in the email to verify your account.`

  return (
    <div className="text-center space-y-6">
      {/* Status Icon */}
      <div className={`w-20 h-20 ${getStatusColor()} rounded-full flex items-center justify-center mx-auto`}>
        {getStatusIcon()}
      </div>

      {/* Title & Description */}
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">
          {title || defaultTitle}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          {description || defaultDescription}
        </p>
      </div>

      {/* Email Display */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <Mail className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900">{email}</span>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-sm text-gray-500 space-y-1">
        <div className="flex items-center justify-center gap-1">
          <Clock className="w-4 h-4" />
          <span>The link will expire in 1 hour</span>
        </div>
        <p>If you don't see the email, check your spam folder</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={handleResend}
          loading={loading}
          disabled={!canResend}
          variant="secondary"
          className="w-full"
        >
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {!canResend && cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              `Resend Email${resendCount > 0 ? ` (${resendCount + 1})` : ''}`
            )}
          </div>
        </Button>

        {onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full"
          >
            Back to Login
          </Button>
        )}
      </div>

      {/* Troubleshooting */}
      {resendCount >= 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-medium text-yellow-800">Still not receiving emails?</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Verify the email address is correct</li>
                <li>• Try adding noreply@{window.location.hostname} to your contacts</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}