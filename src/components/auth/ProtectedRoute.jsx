import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-10 h-10 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin" />
  </div>
)

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useSelector(s => s.auth)
  const location = useLocation()

  // 1. Auth states aur loading status ko track karein
  if (loading) return <Spinner />

  // 2. Agar user logged in hi nahi hai, toh use home page par redirect karein
  // Aur current path ko save kar lein taaki login ke baad wapas yahin aa sake
  if (!user) {
    localStorage.setItem('sb_return_to', location.pathname + location.search)
    return <Navigate to="/" replace />
  }

  // 3. Extract the active role safely (Redux state variable fallback to profile schema)
  const userRole = profile?.role || user?.user_metadata?.role

  // 4. Handle Edge Case: Naya user registered hai par onboarding/profile complete nahi hai
  if (user && !userRole) {
    // Agar profile load nahi hui hai aur routing metadata me bhi nahi hai, 
    // toh loading dikhane ke bajaye session settings check karein
    if (!profile && loading === false) {
      // Allow safety bypass agar registration validation incomplete ho
      return <Spinner />
    }
  }

  // 5. Hardened Role Restrictions Check
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Smart Route Governance Layer (v3.2 Spec Matching)
    if (userRole === 'admin') return <Navigate to="/systemadmin" replace />
    if (userRole === 'service_provider') return <Navigate to="/service-provider" replace />
    if (userRole === 'landlord') return <Navigate to="/landlord" replace />
    
    // Default fallback safely restricted to Tenant Dashboard
    return <Navigate to="/dashboard" replace />
  }

  return children
}