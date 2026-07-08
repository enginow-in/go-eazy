import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    mobileMenuOpen: false,
    searchOpen: false,
    activeCategory: 'all',
  },
  reducers: {
    toggleMobileMenu: (state) => { 
      state.mobileMenuOpen = !state.mobileMenuOpen 
      // Enforce mutually exclusive overlays: close search if menu is opening
      if (state.mobileMenuOpen) {
        state.searchOpen = false
      }
    },
    closeMobileMenu: (state) => { 
      state.mobileMenuOpen = false 
    },
    setSearchOpen: (state, action) => { 
      state.searchOpen = action.payload 
      // Enforce mutually exclusive overlays: close menu if search is opening
      if (action.payload) {
        state.mobileMenuOpen = false
      }
    },
    setActiveCategory: (state, action) => { 
      state.activeCategory = action.payload 
    },
    // Utility action to reset all UI overlays (ideal for route changes)
    closeAllOverlays: (state) => {
      state.mobileMenuOpen = false
      state.searchOpen = false
    }
  },
})

export const { 
  toggleMobileMenu, 
  closeMobileMenu, 
  setSearchOpen, 
  setActiveCategory,
  closeAllOverlays 
} = uiSlice.actions

export default uiSlice.reducer