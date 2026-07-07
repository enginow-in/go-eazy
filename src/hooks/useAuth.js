import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'
import { setUser, setProfile, logout, setLoading, setLoginLockout } from '../store/authSlice'
import {
  isLockedOut,
  recordFailedAttempt,
  recordSuccessfulLogin,
  formatCountdown,
} from '../utils/loginRateLimit'

export const useAuth = () => {
  const dispatch = useDispatch()
  const { user, profile, role, loading, authModalOpen, authModalTab, loginLockout } = useSelector(s => s.auth)

  // Helper: invoke the rate-limit Edge Function (fails open to not block users)
  const callRateLimitFn = async (action, email, success) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl?.startsWith('http')) return null // dev fallback

      const res = await fetch(
        `${supabaseUrl}/functions/v1/check-login-rate-limit`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(
            action === 'record'
              ? { email, action, success }
              : { email, action }
          ),
        }
      )
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null // fail open
    }
  }

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
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { 
        data: { 
          full_name: name,
          role: role 
        } 
      },
    })
    if (error) throw error

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: name,
        role,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        created_at: new Date().toISOString(),
      })
    }
    return data
  }

  const signIn = async ({ email, password }) => {
    // ── 1. Client-side lockout check (instant, no network) ────────────────────
    const localState = isLockedOut(email)
    if (localState.locked) {
      dispatch(setLoginLockout(localState))
      throw new Error(
        `Too many failed attempts. Try again in ${formatCountdown(localState.secondsRemaining)}.`
      )
    }

    // ── 2. Server-side rate limit check (Edge Function) ───────────────────────
    const serverCheck = await callRateLimitFn('check', email)
    if (serverCheck && !serverCheck.allowed) {
      const lockState = {
        locked:            true,
        secondsRemaining:  serverCheck.retryAfterSeconds,
        attemptsRemaining: 0,
      }
      dispatch(setLoginLockout(lockState))
      const mins = Math.ceil(serverCheck.retryAfterSeconds / 60)
      throw new Error(
        `Account temporarily locked. Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`
      )
    }

    // Update Redux with current attempts remaining from server
    if (serverCheck) {
      dispatch(setLoginLockout({
        locked:            false,
        secondsRemaining:  0,
        attemptsRemaining: serverCheck.attemptsRemaining,
      }))
    }

    // ── 3. Attempt Supabase authentication ────────────────────────────────────
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        // ── 4a. Record failure ─────────────────────────────────────────────────
        const clientState = recordFailedAttempt(email)
        dispatch(setLoginLockout(clientState))

        // Fire-and-forget server-side failure recording
        callRateLimitFn('record', email, false)

        // Surface a helpful error message
        if (clientState.locked) {
          throw new Error(
            `Too many failed attempts. Account locked for ${formatCountdown(clientState.secondsRemaining)}.`
          )
        }
        if (clientState.attemptsRemaining <= 2) {
          throw new Error(
            `Incorrect credentials. ${clientState.attemptsRemaining} attempt${clientState.attemptsRemaining !== 1 ? 's' : ''} remaining before lockout.`
          )
        }

        throw error // original Supabase error for other cases
      }

      // ── 4b. Record success ─────────────────────────────────────────────────
      recordSuccessfulLogin(email)
      dispatch(setLoginLockout({ locked: false, secondsRemaining: 0, attemptsRemaining: 5 }))
      callRateLimitFn('record', email, true)

      return data
    } catch (err) {
      // Re-throw if it's already one of our custom messages
      if (err.message?.includes('locked') || err.message?.includes('remaining')) throw err

      // For unexpected errors, still record as a failure
      const clientState = recordFailedAttempt(email)
      dispatch(setLoginLockout(clientState))
      callRateLimitFn('record', email, false)

      throw err
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

  return { user, profile, role, loading, loginLockout, authModalOpen, authModalTab, signUp, signIn, signInWithGoogle, signOut, updateProfile }
}
