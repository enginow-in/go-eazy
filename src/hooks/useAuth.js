import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'
import { setUser, setProfile, logout, setLoading } from '../store/authSlice'

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
        // Security: Never read role from user_metadata — it is client-controlled.
        // New OAuth users always start as 'user'; role can be changed later via settings.
        const safeRole = 'user'
        
        const { data: newProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: user?.email,
            full_name: fullName,
            role: safeRole,
            avatar_url: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
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

  // Roles a user is allowed to self-assign at signup.
  // 'admin' is intentionally omitted — admins are provisioned server-side only.
  const ALLOWED_SIGNUP_ROLES = ['user', 'landlord', 'service_provider']

  const signUp = async ({ email, password, name, role }) => {
    // Validate role against allowlist to prevent privilege escalation.
    // Any value not in the list (e.g. 'admin') is silently normalised to 'user'.
    const safeRole = ALLOWED_SIGNUP_ROLES.includes(role) ? role : 'user'

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: {
          full_name: name,
          // Role is NOT stored in auth metadata — it lives only in the profiles
          // table so it cannot be forged via a crafted signup payload.
        },
      },
    })
    if (error) throw error

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: name,
        role: safeRole,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        created_at: new Date().toISOString(),
      })
    }
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signInWithGoogle = async () => {
    // Sanitise the stored return path to prevent open-redirect (CWE-601).
    // Only accept paths that start with a single '/' and contain no protocol.
    // This blocks: //evil.com, https://evil.com, javascript:alert(1), etc.
    const rawPath = localStorage.getItem('sb_return_to')
    const isSafe =
      typeof rawPath === 'string' &&
      rawPath.startsWith('/') &&
      !rawPath.startsWith('//') &&
      !rawPath.includes(':')
    const redirectUrl = `${window.location.origin}${isSafe ? rawPath : '/search'}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: { prompt: 'select_account' },
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

  return { user, profile, role, loading, authModalOpen, authModalTab, signUp, signIn, signInWithGoogle, signOut, updateProfile }
}
