import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { supabase } from '../lib/supabase'
import { setProfile, logout } from '../store/authSlice'

/**
 * useAuth — state reader + action methods. Safe to call in any component.
 *
 * The Supabase auth subscription is intentionally NOT set up here.
 * It lives in useAuthInit (src/hooks/useAuthInit.js) which is called
 * exactly once at the app root (App.jsx). This prevents N duplicate
 * onAuthStateChange listeners from being registered when useAuth()
 * is consumed by multiple mounted components simultaneously.
 */
export const useAuth = () => {
  const dispatch = useDispatch()
  const { user, profile, role, loading, authModalOpen, authModalTab } = useSelector(s => s.auth)

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
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

  return { user, profile, role, loading, authModalOpen, authModalTab, signUp, signIn, signInWithGoogle, signOut, updateProfile }
}
