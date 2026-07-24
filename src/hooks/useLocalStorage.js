import { useState, useEffect, useCallback } from 'react'

/**
 * useLocalStorage<T>
 *
 * A type-safe, storage-event-aware React hook that syncs state to
 * `localStorage`. Provides the same API as `useState` so it can be used
 * as a drop-in replacement wherever persistence across page reloads is
 * needed.
 *
 * Features:
 *  - Handles JSON serialisation / deserialisation automatically.
 *  - Catches and ignores `localStorage` errors (e.g. private-browsing
 *    mode where `setItem` throws a `SecurityError`).
 *  - Listens to the `storage` event so multiple open tabs stay in sync.
 *  - Falls back to the `initialValue` if the key is absent or if the
 *    stored value is unparseable.
 *
 * @template T
 * @param {string}   key          - The localStorage key to read/write.
 * @param {T}        initialValue - Value to use when the key is absent.
 * @returns {[T, (value: T | ((prev: T) => T)) => void]}
 *
 * @example
 * // Persist the search view-mode preference across navigations
 * const [viewMode, setViewMode] = useLocalStorage('goeazy_view_mode', 'grid')
 *
 * @example
 * // Persist an object (automatically serialised to JSON)
 * const [prefs, setPrefs] = useLocalStorage('goeazy_prefs', { lang: 'en' })
 */
export function useLocalStorage(key, initialValue) {
  // Lazy initialiser: read from storage once on mount
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  // Wrapped setter that mirrors the value to localStorage
  const setValue = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function' ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // Silently ignore quota or SecurityError (e.g. private browsing)
        }
        return next
      })
    },
    [key],
  )

  // Keep in sync with changes made by other browser tabs
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== key || event.storageArea !== window.localStorage) return
      try {
        setStoredValue(event.newValue !== null ? JSON.parse(event.newValue) : initialValue)
      } catch {
        setStoredValue(initialValue)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key, initialValue])

  return [storedValue, setValue]
}
