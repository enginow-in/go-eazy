import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    profile: null,
    role: null, // 'landlord' | 'user' | 'service_provider'
    loading: true,
    initialized: false, // true once the first auth check completes
    authModalOpen: false,
    authModalTab: 'login', // 'login' | 'signup'
    loginLockout: {
      locked: false,
      secondsRemaining: 0,
      attemptsRemaining: 5, // counts down on each failed attempt
    },
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
      state.initialized = true // auth state is now known
      // Do NOT clear loading here — we wait for setProfile to resolve the role
      if (!action.payload) state.loading = false // only clear if logged out
    },
    setProfile: (state, action) => {
      state.profile = action.payload
      state.role = action.payload?.role || null
      state.loading = false // role is now known — safe to render
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    openAuthModal: (state, action) => {
      state.authModalOpen = true
      state.authModalTab = action.payload || 'login'
    },
    closeAuthModal: (state) => {
      state.authModalOpen = false
    },
    logout: (state) => {
      state.user = null
      state.profile = null
      state.role = null
      state.loading = false
      state.initialized = true
    },
    setLoginLockout: (state, action) => {
      // action.payload: { locked, secondsRemaining, attemptsRemaining }
      state.loginLockout = {
        locked:            action.payload.locked            ?? false,
        secondsRemaining:  action.payload.secondsRemaining  ?? 0,
        attemptsRemaining: action.payload.attemptsRemaining ?? 5,
      }
    },
  },
})

export const { setUser, setProfile, setLoading, openAuthModal, closeAuthModal, logout, setLoginLockout } = authSlice.actions
export default authSlice.reducer
