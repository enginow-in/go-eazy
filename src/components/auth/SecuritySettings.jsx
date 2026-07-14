import { useState } from 'react'
import { Shield, Lock, Eye, EyeOff, Key, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { PasswordStrengthIndicator } from '../ui/PasswordStrengthIndicator'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { validatePassword } from '../../utils/validation'
import toast from 'react-hot-toast'

export const SecuritySettings = () => {
  const { user, updatePassword } = useAuth()
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!passwords.current) {
      newErrors.current = 'Current password is required'
    }
    
    const passwordValidation = validatePassword(passwords.new)
    if (!passwordValidation.isValid) {
      newErrors.new = passwordValidation.errors[0]
    }
    
    if (!passwords.confirm) {
      newErrors.confirm = 'Please confirm your new password'
    } else if (passwords.new !== passwords.confirm) {
      newErrors.confirm = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      // First verify current password by attempting to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwords.current
      })
      
      if (error) {
        setErrors({ current: 'Current password is incorrect' })
        return
      }
      
      // Update to new password
      await updatePassword(passwords.new)
      
      // Clear form
      setPasswords({ current: '', new: '', confirm: '' })
      setErrors({})
      
      toast.success('Password updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
      if (err.message.includes('current password')) {
        setErrors({ current: 'Current password is incorrect' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEmailResend = async () => {
    setLoading(true)
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })
      toast.success('Verification email sent!')
    } catch (err) {
      toast.error(err.message || 'Failed to send verification email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Account Status */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Account Security</h3>
        </div>
        
        <div className="grid gap-4">
          {/* Email Verification Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Email Verification</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.email_confirmed_at ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">Unverified</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleEmailResend}
                    loading={loading}
                    className="ml-2"
                  >
                    Resend
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Account Created */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Account Created</p>
                <p className="text-sm text-gray-600">
                  {new Date(user?.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            type={showPasswords ? 'text' : 'password'}
            label="Current Password"
            placeholder="Enter your current password"
            value={passwords.current}
            onChange={(e) => {
              setPasswords(prev => ({ ...prev, current: e.target.value }))
              setErrors(prev => ({ ...prev, current: '' }))
            }}
            error={errors.current}
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
          />

          <div className="space-y-2">
            <Input
              type={showPasswords ? 'text' : 'password'}
              label="New Password"
              placeholder="Enter your new password"
              value={passwords.new}
              onChange={(e) => {
                setPasswords(prev => ({ ...prev, new: e.target.value }))
                setErrors(prev => ({ ...prev, new: '' }))
              }}
              error={errors.new}
              leftIcon={<Lock size={16} />}
              required
            />
            
            {passwords.new && (
              <div className="px-1">
                <PasswordStrengthIndicator password={passwords.new} showDetails={true} />
              </div>
            )}
          </div>

          <Input
            type={showPasswords ? 'text' : 'password'}
            label="Confirm New Password"
            placeholder="Confirm your new password"
            value={passwords.confirm}
            onChange={(e) => {
              setPasswords(prev => ({ ...prev, confirm: e.target.value }))
              setErrors(prev => ({ ...prev, confirm: '' }))
            }}
            error={errors.confirm}
            leftIcon={<Lock size={16} />}
            required
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            disabled={!passwords.current || !passwords.new || !passwords.confirm}
          >
            Update Password
          </Button>
        </form>
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Security Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use a unique password that you don't use anywhere else</li>
              <li>• Include a mix of uppercase, lowercase, numbers, and special characters</li>
              <li>• Avoid using personal information like names or birthdays</li>
              <li>• Consider using a password manager to generate and store secure passwords</li>
              <li>• Change your password if you suspect it may have been compromised</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}