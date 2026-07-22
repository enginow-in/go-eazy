import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'goeazy_dark_mode'

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY, isDark)
  }, [isDark])

  const toggle = useCallback(() => setIsDark(v => !v), [])
  const enable = useCallback(() => setIsDark(true), [])
  const disable = useCallback(() => setIsDark(false), [])

  return { isDark, toggle, enable, disable }
}
