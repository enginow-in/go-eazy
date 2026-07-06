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

  // Wait for the initial auth check to complete before making any decisions.
  // Without this, a slow getSession() call can cause a premature redirect
  // because `user` is transiently null before the session is hydrated.
  if (!initialized || loading || (user && !profile)) return <Spinner />

  // Auth is fully resolved — user is definitively not logged in
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
