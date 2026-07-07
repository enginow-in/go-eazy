import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Sun, Moon } from 'lucide-react'
import { toggleDarkMode } from '../../store/uiSlice'

/**
 * ThemeToggle — A smooth, animated light/dark mode toggle button.
 * Reads state from Redux (uiSlice.darkMode) and dispatches toggleDarkMode.
 * The uiSlice handles persisting the preference to localStorage and applying
 * the 'dark' class to <html>.
 */
export const ThemeToggle = ({ className = '' }) => {
  const dispatch = useDispatch()
  const { darkMode } = useSelector(s => s.ui)

  return (
    <button
      id="theme-toggle"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => dispatch(toggleDarkMode())}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full 
        transition-all duration-300 ease-out
        bg-gray-100 hover:bg-gray-200 
        dark:bg-gray-700 dark:hover:bg-gray-600
        text-gray-600 dark:text-yellow-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CA3433] focus-visible:ring-offset-2
        active:scale-90
        ${className}`}
    >
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{ opacity: darkMode ? 0 : 1, transform: darkMode ? 'rotate(-90deg) scale(0.5)' : 'rotate(0deg) scale(1)' }}
        aria-hidden="true"
      >
        <Sun size={16} />
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{ opacity: darkMode ? 1 : 0, transform: darkMode ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)' }}
        aria-hidden="true"
      >
        <Moon size={16} />
      </span>
    </button>
  )
}
