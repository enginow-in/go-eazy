import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'
import { setUser, setProfile, logout, setLoading } from '../store/authSlice'
import { validateEmail, validatePassword } from '../utils/validation'
import { getAuthErrorMessage } from '../utils/authErrors'

export const useAuth = () => {
  const dispatch = useDispatch()
  const { user, profile, role, loading, authModalOpen, authModalTab } = useSelector(s => s.auth)

  useEffect(() => {
    let mounted = true
    let initComplete = false

    // Timeout to prevent infinite loading (15 seconds)
    const loadingTimeout = setTimeout(() => {
      if (mounted && !initComplete) {
        console.error('⏰ Auth initialization timeout - forcing app to load')
        dispatch(setLoading(false))
      }
    }, 15000)

    // Initialize auth
    const initAuth = async () => {
      console.log('🔐 Starting auth initialization...')
      
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('❌ Session error:', error)
          initComplete = true
          dispatch(setLoading(false))
          return
        }

        if (session?.user) {
          console.log('✅ Found user session:', session.user.id)
          dispatch(setUser(session.user))
          await loadProfile(session.user.id)
        } else {
          console.log('❌ No user session found')
          initComplete = true
          dispatch(setLoading(false))
        }
      } catch (err) {
        console.error('❌ Auth init error:', err)
        if (mounted) {
          initComplete = true
          dispatch(setLoading(false))
        }
      }
    }

    // Auth state changes - only listen for changes, not initial state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || !initComplete) return
      
      console.log('🔐 Auth state change:', event, !!session?.user)

      if (event === 'SIGNED_OUT' || !session?.user) {
        dispatch(logout())
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        dispatch(setUser(session.user))
        await loadProfile(session.user.id)
      }
    })

    initAuth()

    return () => {
      mounted = false
      initComplete = true
      clearTimeout(loadingTimeout)
      subscription?.unsubscribe()
    }
  }, [dispatch])

  const loadProfile = async (userId) => {
    try {
      console.log('👤 Loading profile for:', userId)
      
      // Add timeout for profile loading (10 seconds)
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile loading timeout')), 10000)
      )

      // Try to get existing profile with timeout
      let { data: profile, error } = await Promise.race([profilePromise, timeoutPromise])

      if (error && error.code !== 'PGRST116' && error.message !== 'Profile loading timeout') {
        console.error('❌ Profile fetch error:', error)
      }

      // Create profile if doesn't exist
      if (!profile) {
        console.log('📝 Creating new profile...')
        
        const { data: { user } } = await supabase.auth.getUser()
        
        const newProfile = {
          id: userId,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          role: user?.user_metadata?.role || 'user',
          avatar_url: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          created_at: new Date().toISOString()
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single()

        if (createError) {
          console.error('❌ Profile creation error:', createError)
          // Use the profile we tried to create as fallback
          profile = newProfile
        } else {
          profile = createdProfile
        }
      }

      console.log('✅ Profile loaded:', profile?.full_name)
      dispatch(setProfile(profile))
    } catch (err) {
      console.error('❌ Profile load error:', err)
      // Set minimal profile to prevent app from breaking
      dispatch(setProfile({
        id: userId,
        full_name: 'User',
        role: 'user'
      }))
    } finally {
      dispatch(setLoading(false))
      initComplete = true
    }
  }

  const signUp = async ({ email, password, name, role }) => {
    console.log('🔐 Starting signup...')
    
    // Validate
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.errors[0])
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0])
    }

    if (!name?.trim()) {
      throw new Error('Full name is required')
    }

    // Sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim(),
          role: role || 'user'
        }
      }
    })

    if (error) {
      console.error('❌ Signup error:', error)
      throw new Error(getAuthErrorMessage(error))
    }

    console.log('✅ Signup successful')
    return data
  }

  const signIn = async ({ email, password }) => {
    console.log('🔐 Starting signin...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    })

    if (error) {
      console.error('❌ Signin error:', error)
      throw new Error(getAuthErrorMessage(error))
    }

    console.log('✅ Signin successful')
    return data
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/search`
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    dispatch(logout())
  }

  const resetPassword = async (email) => {
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.errors[0])
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) throw new Error(getAuthErrorMessage(error))
  }

  const updatePassword = async (newPassword) => {
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0])
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(getAuthErrorMessage(error))
  }

  const resendVerification = async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth-callback`
      }
    })
    if (error) throw new Error(getAuthErrorMessage(error))
  }

  const updateProfile = async (updates) => {
    if (!user?.id) {
      throw new Error('You must be signed in to update your profile')
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates }, { onConflict: 'id' })
      .select()
      .single()
    
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