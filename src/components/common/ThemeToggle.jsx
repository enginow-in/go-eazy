import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Sun, Moon } from 'lucide-react'
import { toggleDarkMode } from '../../store/uiSlice'

/**
 * ThemeToggle
 * A compact button that switches between light and dark mode.
 * State is managed in Redux (uiSlice) and persisted to localStorage.
 * The `dark` class is applied to <html> by the slice, so Tailwind dark:
 * variants and the CSS custom properties in index.css both respond.
 */
export const ThemeToggle = ({ className = '' }) => {
  const dispatch = useDispatch()
  const darkMode = useSelector(s => s.ui.darkMode)

  return (
    <button
      id="theme-toggle"
      type="button"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => dispatch(toggleDarkMode())}
      className={`relative flex items-center justify-center w-9 h-9 rounded-full
        transition-all duration-300
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-700 dark:hover:bg-gray-600
        text-gray-600 dark:text-yellow-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CA3433] focus-visible:ring-offset-2
        active:scale-90 shrink-0
        ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute transition-all duration-300"
        style={{
          opacity: darkMode ? 0 : 1,
          transform: darkMode ? 'rotate(-90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
        }}
      >
        <Sun size={16} />
      </span>
      <span
        aria-hidden="true"
        className="absolute transition-all duration-300"
        style={{
          opacity: darkMode ? 1 : 0,
          transform: darkMode ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
        }}
      >
        <Moon size={16} />
      </span>
    </button>
  )
}
