import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'

export const AuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('processing') // processing, success, error, expired
  const [message, setMessage] = useState('')

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      
      if (error) {
        if (error === 'access_denied') {
          setStatus('error')
          setMessage('Email verification was cancelled or denied.')
        } else if (errorDescription?.includes('expired')) {
          setStatus('expired')
          setMessage('Your verification link has expired. Please request a new verification email.')
        } else {
          setStatus('error')
          setMessage(errorDescription || 'An error occurred during verification.')
        }
        return
      }

      // Handle the auth callback
      const { data, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        console.error('Auth callback error:', authError)
        if (authError.message.includes('expired')) {
          setStatus('expired')
          setMessage('Your verification link has expired. Please request a new verification email.')
        } else {
          setStatus('error')
          setMessage('Failed to verify your account. Please try again.')
        }
        return
      }

      if (data.session) {
        setStatus('success')
        setMessage('Email verified successfully! Welcome to GoEazy.')
        toast.success('Email verified successfully!')
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/search')
        }, 2000)
      } else {
        setStatus('error')
        setMessage('Unable to verify your email. Please try again.')
      }
      
    } catch (err) {
      console.error('Callback error:', err)
      setStatus('error')
      setMessage('An unexpected error occurred. Please try again.')
    }
  }

  const handleResendVerification = () => {
    navigate('/auth?tab=signup&resend=true')
  }

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verifying your email...</h2>
            <p className="text-gray-600">Please wait while we confirm your account.</p>
          </>
        )

      case 'success':
        return (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you to the app...</p>
          </>
        )

      case 'expired':
        return (
          <>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Link Expired</h2>
            <p className="text-gray-600">{message}</p>
            <Button onClick={handleResendVerification} className="w-full mt-4">
              Request New Verification Email
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Back to Login
            </Button>
          </>
        )

      case 'error':
        return (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="text-gray-600">{message}</p>
            <Button onClick={() => navigate('/auth')} className="w-full mt-4">
              Back to Login
            </Button>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-4">
        {renderContent()}
      </div>
    </div>
  )
}