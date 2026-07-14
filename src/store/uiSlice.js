import { createSlice } from '@reduxjs/toolkit'

// Read the saved preference before the store is created.
// Applying the class here avoids a flash of the wrong theme on first paint.
const saved = localStorage.getItem('go-eazy-theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = saved ? saved === 'dark' : prefersDark
document.documentElement.classList.toggle('dark', isDark)

const applyTheme = (dark) => {
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem('go-eazy-theme', dark ? 'dark' : 'light')
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    mobileMenuOpen: false,
    searchOpen: false,
    activeCategory: 'all',
    darkMode: isDark,
  },
  reducers: {
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen },
    closeMobileMenu:  (state) => { state.mobileMenuOpen = false },
    setSearchOpen:    (state, action) => { state.searchOpen = action.payload },
    setActiveCategory:(state, action) => { state.activeCategory = action.payload },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      applyTheme(state.darkMode)
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload
      applyTheme(action.payload)
    },
  },
})

export const {
  toggleMobileMenu, closeMobileMenu,
  setSearchOpen, setActiveCategory,
  toggleDarkMode, setDarkMode,
} = uiSlice.actions

export default uiSlice.reducer

