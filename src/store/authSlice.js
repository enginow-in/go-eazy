import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  profile: null,
  role: null, // 'landlord' | 'user' | 'service_provider'
  loading: true,
  authModalOpen: false,
  authModalTab: 'login', // 'login' | 'signup'
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      // Do NOT clear loading here — we wait for setProfile to resolve the role
      if (!action.payload) {
        state.profile = null;
        state.role = null;
        state.loading = false; // only clear if logged out explicitly
      }
    },
    setProfile: (state, action) => {
      const profileData = action.payload || null;
      state.profile = profileData;
      state.role = profileData?.role || null;
      state.loading = false; // role is now known — safe to render
    },
    setLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
    openAuthModal: (state, action) => {
      state.authModalOpen = true;
      state.authModalTab = action.payload === 'signup' ? 'signup' : 'login';
    },
    closeAuthModal: (state) => {
      state.authModalOpen = false;
      state.authModalTab = 'login'; // Clean stale dynamic tabs state immediately on close
    },
    logout: (state) => {
      state.user = null;
      state.profile = null;
      state.role = null;
      state.loading = false;
      state.authModalOpen = false;
      state.authModalTab = 'login'; // Ensure complete layout state purge on logout
    },
  },
})

export const { setUser, setProfile, setLoading, openAuthModal, closeAuthModal, logout } = authSlice.actions
export default authSlice.reducer