import { createSlice } from '@reduxjs/toolkit'

// Initialize dark mode from localStorage on first load
const savedTheme = localStorage.getItem('go-eazy-theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDarkInitial = savedTheme ? savedTheme === 'dark' : prefersDark
// Apply class immediately to prevent flash of wrong theme
if (isDarkInitial) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    mobileMenuOpen: false,
    searchOpen: false,
    activeCategory: 'all',
    darkMode: isDarkInitial,
  },
  reducers: {
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen },
    closeMobileMenu: (state) => { state.mobileMenuOpen = false },
    setSearchOpen: (state, action) => { state.searchOpen = action.payload },
    setActiveCategory: (state, action) => { state.activeCategory = action.payload },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      const newTheme = state.darkMode ? 'dark' : 'light'
      localStorage.setItem('go-eazy-theme', newTheme)
      if (state.darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload
      const newTheme = action.payload ? 'dark' : 'light'
      localStorage.setItem('go-eazy-theme', newTheme)
      if (action.payload) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
  },
})

export const { toggleMobileMenu, closeMobileMenu, setSearchOpen, setActiveCategory, toggleDarkMode, setDarkMode } = uiSlice.actions
export default uiSlice.reducer
