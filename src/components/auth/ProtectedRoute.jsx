import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin" />
  </div>
)

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, role, loading, initialized } = useSelector(s => s.auth)

  // Show spinner while auth is loading OR while user is logged in but profile hasn't loaded yet.
  // `initialized` only becomes true after Supabase's auth listener delivers its first
  // definitive session check — an independent guard so we never redirect off a `loading`
  // flag that flipped false prematurely.
  if (!initialized || loading || (user && !profile)) return <Spinner />

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
