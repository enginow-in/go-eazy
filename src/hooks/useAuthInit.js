import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { supabase } from '../lib/supabase'
import { setUser, setProfile, logout, setLoading } from '../store/authSlice'

/**
 * fetchProfile — shared profile-fetch logic used by both the initial
 * session check and the onAuthStateChange listener. Kept here so
 * useAuthInit is the single owner of all auth subscription side-effects.
 */
const fetchProfile = async (userId, dispatch) => {
  try {
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!data && !error) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      // ── GHOST SESSION GUARD ──
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

/**
 * useAuthInit — CALL ONLY ONCE at the app root (App.jsx).
 *
 * Sets up the Supabase auth session listener and profile fetcher.
 * Separating this from useAuth() prevents N duplicate subscriptions
 * being registered when useAuth() is called in many child components.
 */
export const useAuthInit = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Get initial session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('Auth: Session error', error)
      dispatch(setUser(session?.user ?? null))
      if (session?.user) fetchProfile(session.user.id, dispatch)
      else dispatch(setLoading(false))
    })

    // Listen for auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      dispatch(setUser(session?.user ?? null))
      if (session?.user) {
        fetchProfile(session.user.id, dispatch)
      } else if (event === 'SIGNED_OUT') {
        dispatch(logout())
      } else {
        dispatch(setLoading(false))
      }
    })

    return () => subscription.unsubscribe()
  }, [dispatch])
}
