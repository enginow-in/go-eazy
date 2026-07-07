import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AlertCircle, RefreshCw } from 'lucide-react'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin" />
  </div>
)

const LoadingError = ({ onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Error</h2>
      <p className="text-gray-600 mb-6">
        There was a problem loading your profile. Please try again.
      </p>
      
      <button
        onClick={onRetry}
        className="w-full bg-[#CA3433] text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw size={16} />
        Try Again
      </button>
    </div>
  </div>
)

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, role, loading } = useSelector(s => s.auth)
  const [showError, setShowError] = useState(false)

  // Timeout for profile loading - if user is logged in but profile doesn't load in 20 seconds, show error
  useEffect(() => {
    if (user && !profile && !loading) {
      const timeout = setTimeout(() => {
        setShowError(true)
      }, 20000)

      return () => clearTimeout(timeout)
    } else {
      setShowError(false)
    }
  }, [user, profile, loading])

  // Show spinner while auth is loading OR while user is logged in but profile hasn't loaded yet
  if (loading || (user && !profile && !showError)) return <Spinner />

  // Show error if profile failed to load
  if (user && !profile && showError) {
    return <LoadingError onRetry={() => window.location.reload()} />
  }

  // Not logged in at all
  if (!user) return <Navigate to="/" replace />

  // Role restriction check
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Smart redirect to correct dashboard for this user's actual role
    if (role === 'admin') return <Navigate to="/systemadmin" replace />
    if (role === 'service_provider') return <Navigate to="/service-provider" replace />
    if (role === 'landlord') return <Navigate to="/landlord" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}
