import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: { id: 'dummy-user-123', email: 'open@source.local' },
    profile: { id: 'dummy-user-123', full_name: 'Open Source User', role: 'admin' },
    role: 'admin', // mocked as admin so they can see everything
    loading: false,
    authModalOpen: false,
    authModalTab: 'login', // 'login' | 'signup'
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
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
    },
  },
})

export const { setUser, setProfile, setLoading, openAuthModal, closeAuthModal, logout } = authSlice.actions
export default authSlice.reducer
