import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { supabase } from '../../lib/supabase'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin" />
  </div>
)

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, role, loading } = useSelector(s => s.auth)
  
  const [isVerified, setIsVerified] = useState(false)
  const [dbRole, setDbRole] = useState(null)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    let isMounted = true
    const verifyRole = async () => {
      if (!user) {
        if (isMounted) setVerifying(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        
        if (isMounted) {
          setDbRole(data.role)
          setIsVerified(true)
        }
      } catch (err) {
        console.error('Role verification failed:', err)
        if (isMounted) {
          setDbRole(null)
          setIsVerified(true)
        }
      } finally {
        if (isMounted) setVerifying(false)
      }
    }

    if (!loading) {
      if (user) {
        verifyRole()
      } else {
        setVerifying(false)
      }
    }

    return () => { isMounted = false }
  }, [user, loading])

  // Show spinner while auth is loading OR while user is logged in but profile hasn't loaded yet OR while verifying DB
  if (loading || (user && !profile) || (user && verifying)) return <Spinner />

  // Not logged in at all
  if (!user) return <Navigate to="/" replace />

  // Use the DB verified role if available, fallback to Redux role
  const actualRole = isVerified ? dbRole : role

  // Role restriction check
  if (allowedRoles && !allowedRoles.includes(actualRole)) {
    // Smart redirect to correct dashboard for this user's actual role
    if (actualRole === 'admin') return <Navigate to="/systemadmin" replace />
    if (actualRole === 'service_provider') return <Navigate to="/service-provider" replace />
    if (actualRole === 'landlord') return <Navigate to="/landlord" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}
