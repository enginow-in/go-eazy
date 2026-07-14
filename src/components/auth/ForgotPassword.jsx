import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Mail, ArrowLeft } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { EmailVerificationStatus } from './EmailVerificationStatus'
import { useAuth } from '../../hooks/useAuth'
import { validateEmail } from '../../utils/validation'

export const ForgotPassword = ({ onBack }) => {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setError(emailValidation.errors[0])
      return
    }
    
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
      toast.success('Password reset email sent!')
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <EmailVerificationStatus
        email={email}
        onResend={() => resetPassword(email)}
        onBack={onBack}
        type="password-reset"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold">Reset Password</h3>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          leftIcon={<Mail size={16} />}
          required
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Send Reset Link
        </Button>
      </form>
    </div>
  )
}