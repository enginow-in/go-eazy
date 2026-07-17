import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  mobileMenuOpen: false,
  searchOpen: false,
  activeCategory: 'all',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMobileMenu: (state) => { 
      state.mobileMenuOpen = !state.mobileMenuOpen 
    },
    closeMobileMenu: (state) => { 
      state.mobileMenuOpen = false 
    },
    setSearchOpen: (state, action) => { 
      state.searchOpen = Boolean(action.payload) 
    },
    setActiveCategory: (state, action) => { 
      // Ensure incoming strings are normalized and secure fallback parameters exist
      state.activeCategory = typeof action.payload === 'string' && action.payload.trim() 
        ? action.payload.trim() 
        : 'all';
    },
    resetUiOverlays: (state) => {
      // Complete visual state purge hook to safely run during screen route transitions
      state.mobileMenuOpen = false;
      state.searchOpen = false;
    }
  },
})

export const { toggleMobileMenu, closeMobileMenu, setSearchOpen, setActiveCategory, resetUiOverlays } = uiSlice.actions
export default uiSlice.reducer