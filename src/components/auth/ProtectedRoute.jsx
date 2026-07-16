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
  const { user, profile, loading } = useSelector(s => s.auth)
  const [verifiedRole, setVerifiedRole] = useState(null)
  const [checkingRole, setCheckingRole] = useState(false)

  useEffect(() => {
    let active = true

    const verifyRole = async () => {
      if (!user) {
        setVerifiedRole(null)
        setCheckingRole(false)
        return
      }

      setCheckingRole(true)
      try {
        const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
        if (sessionError || !sessionUser || sessionUser.id !== user.id) {
          if (active) setVerifiedRole(null)
          return
        }

        const { data: verifiedProfile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', sessionUser.id)
          .maybeSingle()

        if (error) throw error
        if (active) setVerifiedRole(verifiedProfile?.role || null)
      } catch (error) {
        console.error('ProtectedRoute: role verification failed', error)
        if (active) setVerifiedRole(null)
      } finally {
        if (active) setCheckingRole(false)
      }
    }

    verifyRole()
    return () => { active = false }
  }, [user])

  // Show spinner while auth is loading OR while user is logged in but profile hasn't loaded yet
  if (loading || (user && (!profile || checkingRole))) return <Spinner />

  // Not logged in at all
  if (!user) return <Navigate to="/" replace />

  // Role restriction check
  if (!verifiedRole || (allowedRoles && !allowedRoles.includes(verifiedRole))) {
    // Smart redirect to correct dashboard for this user's actual role
    if (verifiedRole === 'admin') return <Navigate to="/systemadmin" replace />
    if (verifiedRole === 'service_provider') return <Navigate to="/service-provider" replace />
    if (verifiedRole === 'landlord') return <Navigate to="/landlord" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}
