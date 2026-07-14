import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Spinner } from '../ui/Spinner'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, role, loading } = useSelector(s => s.auth)

  // Show spinner while auth is loading OR while user is logged in but profile hasn't loaded yet
  if (loading || (user && !profile)) return <Spinner />

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
