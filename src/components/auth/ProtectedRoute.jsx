import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin" />
  </div>
)

const roleRedirectMap = {
  admin: '/systemadmin',
  service_provider: '/service-provider',
  landlord: '/landlord',
  user: '/dashboard',
}

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, role, loading, authChecked } = useSelector(s => s.auth)

  // Wait for initial auth check to complete and for profile to load when user exists
  if (!authChecked || loading || (user && !profile)) return <Spinner />

  // Not logged in at all (after auth check)
  if (!user) return <Navigate to="/" replace />

  // Role restriction check
  if (allowedRoles && !allowedRoles.includes(role)) {
    const redirectTo = roleRedirectMap[role] || '/'
    return <Navigate to={redirectTo} replace />
  }

  return children
}
