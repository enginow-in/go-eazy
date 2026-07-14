import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'
import { setUser, setProfile, logout, setLoading } from '../store/authSlice'
import { validateEmail, validatePassword } from '../utils/validation'
import { getAuthErrorMessage, formatErrorForLogging } from '../utils/authErrors'

// Rate limiting for authentication attempts
const RATE_LIMIT_STORAGE_KEY = 'auth_attempts'
const MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes

const getRateLimitInfo = () => {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY)
    return stored ? JSON.parse(stored) : { attempts: 0, lastAttempt: 0 }
  } catch {
    return { attempts: 0, lastAttempt: 0 }
  }
}

const updateRateLimit = () => {
  const now = Date.now()
  const info = getRateLimitInfo()
  
  // Reset if window has passed
  if (now - info.lastAttempt > RATE_LIMIT_WINDOW) {
    info.attempts = 1
  } else {
    info.attempts += 1
  }
  
  info.lastAttempt = now
  localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(info))
  return info
}

const checkRateLimit = () => {
  const info = getRateLimitInfo()
  const now = Date.now()
  
  if (now - info.lastAttempt > RATE_LIMIT_WINDOW) {
    return { allowed: true, remainingTime: 0 }
  }
  
  if (info.attempts >= MAX_ATTEMPTS) {
    const remainingTime = RATE_LIMIT_WINDOW - (now - info.lastAttempt)
    return { allowed: false, remainingTime }
  }
  
  return { allowed: true, remainingTime: 0 }
}

export const useAuth = () => {
  const dispatch = useDispatch()
  const { user, profile, role, loading, authModalOpen, authModalTab } = useSelector(s => s.auth)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {

      if (error) console.error('Auth: Session error', error)
      
      dispatch(setUser(session?.user ?? null))
      if (session?.user) fetchProfile(session.user.id)
      else dispatch(setLoading(false))
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {

      
      dispatch(setUser(session?.user ?? null))
      if (session?.user) {
        fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        dispatch(logout())
      } else {
        dispatch(setLoading(false))
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      // First try to fetch
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      // If no profile exists (e.g., first-time OAuth), create one automatically
      if (!data && !error) {

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        // ── GHOST SESSION GUARD ──
        // If the user no longer exists in Supabase (deleted from dashboard),
        // their JWT is orphaned. Force sign them out immediately.
        if (userError || !user) {
          console.warn('Auth: Ghost session detected — user deleted. Forcing sign-out.')
          await supabase.auth.signOut()
          dispatch(logout())
          return
        }

        const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
        const userRole = user?.user_metadata?.role || null
        
        const { data: newProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: user?.email,
            full_name: fullName,
            role: userRole,
            avatar_url: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`,
            created_at: new Date().toISOString()
          })
          .select()
          .maybeSingle()

        if (upsertError) {
          // ── FK CONSTRAINT GUARD ──
          // code 23503 = foreign key violation (user deleted from auth.users)
          // status 403/401 = JWT is now invalid
          const isGhostUser = upsertError.code === '23503' || upsertError.status === 403 || upsertError.status === 401
          if (isGhostUser) {
            console.warn('Auth: Deleted account confirmed via FK/auth error. Forcing sign-out.')
            await supabase.auth.signOut()
            dispatch(logout())
            return
          }
          console.error('Auth: Profile creation failed', upsertError)
          throw upsertError
        }
        data = newProfile
      } else if (error) {
        // ── FETCH ERROR GUARD ──
        // 403/401 on profile fetch = stale/invalid token (user deleted)
        const isAuthError = error.status === 403 || error.status === 401
        if (isAuthError) {
          console.warn('Auth: Invalid token on profile fetch. Forcing sign-out.')
          await supabase.auth.signOut()
          dispatch(logout())
          return
        }
        console.error('Auth: Profile fetch error', error)
        throw error
      }


      dispatch(setProfile(data))
    } catch (err) {
      console.error('Auth: fetchProfile catch block', err)
      dispatch(setLoading(false))
    }
  }

  const signUp = async ({ email, password, name, role }) => {
    try {
      // Validate inputs
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.errors[0])
      }

      const passwordValidation = validatePassword(password)
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors[0])
      }

      if (!name || name.trim().length < 2) {
        throw new Error('Please provide a valid full name')
      }
      
      // First attempt: Create user via admin API to bypass email verification
      const { data, error } = await supabase.auth.signUp({
        email, 
        password,
        options: { 
          data: { 
            full_name: name.trim(),
            role: role 
          }
        }
      })
      
      if (error) {
        throw new Error(getAuthErrorMessage(error))
      }

      // Create profile immediately
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email.toLowerCase(),
          full_name: name.trim(),
          role,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          created_at: new Date().toISOString(),
        })

        // Force sign in if no session was created
        if (!data.session) {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          return signInData
        }
      }
      
      return data
    } catch (error) {
      throw error
    }
  }

  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.toLowerCase(), 
        password 
      })
      
      if (error) {
        throw new Error(getAuthErrorMessage(error))
      }
      
      return data
    } catch (error) {
      throw error
    }
  }

  const signInWithGoogle = async () => {
    // Priority: Saved return path > Env variable > current origin
    const savedPath = localStorage.getItem('sb_return_to')
    const redirectUrl = savedPath 
      ? `${window.location.origin}${savedPath}`
      : (import.meta.env.VITE_REDIRECT_URL || `${window.location.origin}/search`)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account'
        }
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    dispatch(logout())
  }

  const resetPassword = async (email) => {
    try {
      // Validate email
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.errors[0])
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) {
        console.error('Password reset error:', formatErrorForLogging(error, { action: 'password_reset', email }))
        throw new Error(getAuthErrorMessage(error))
      }
      
      return data
    } catch (error) {
      throw error
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      // Validate new password
      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors[0])
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        console.error('Password update error:', formatErrorForLogging(error, { action: 'password_update' }))
        throw new Error(getAuthErrorMessage(error))
      }
      
      return data
    } catch (error) {
      throw error
    }
  }

  const resendVerification = async (email) => {
    try {
      // Validate email
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.errors[0])
      }

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth-callback`
        }
      })
      
      if (error) {
        console.error('Email verification resend error:', formatErrorForLogging(error, { action: 'resend_verification', email }))
        throw new Error(getAuthErrorMessage(error))
      }
      
      return data
    } catch (error) {
      throw error
    }
  }

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .maybeSingle()
    if (error) throw error
    dispatch(setProfile(data))
    return data
  }

  return { 
    user, 
    profile, 
    role, 
    loading, 
    authModalOpen, 
    authModalTab, 
    signUp, 
    signIn, 
    signInWithGoogle, 
    signOut, 
    resetPassword, 
    updatePassword, 
    resendVerification, 
    updateProfile 
  }
}
