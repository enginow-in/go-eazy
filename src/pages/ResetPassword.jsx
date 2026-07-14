import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { PasswordStrengthIndicator } from '../components/ui/PasswordStrengthIndicator'
import { useAuth } from '../hooks/useAuth'
import { validatePassword } from '../utils/validation'

export const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { updatePassword } = useAuth()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Check if we have the required tokens from URL
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      toast.error('Invalid or expired reset link')
      navigate('/auth')
    }
  }, [searchParams, navigate])

  const validate = () => {
    const newErrors = {}
    
    // Validate new password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0]
    }
    
    // Check password confirmation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      toast.success('Password updated successfully!')
    } catch (err) {
      if (err.message.includes('expired')) {
        toast.error('Your password reset link has expired. Please request a new one.')
        navigate('/auth')
      } else {
        toast.error(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Password Updated!</h2>
          <p className="text-gray-600">
            Your password has been updated successfully. You can now log in with your new password.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="w-full mt-6"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="New Password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors(prev => ({ ...prev, password: '' }))
              }}
              error={errors.password}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
            />
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="px-1">
                <PasswordStrengthIndicator password={password} showDetails={true} />
              </div>
            )}
          </div>

          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm New Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setErrors(prev => ({ ...prev, confirmPassword: '' }))
            }}
            error={errors.confirmPassword}
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full mt-6"
          >
            Update Password
          </Button>
        </form>
      </div>
    </div>
  )
}