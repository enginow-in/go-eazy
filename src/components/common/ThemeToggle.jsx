import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'

export const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggle } = useDarkMode()

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
