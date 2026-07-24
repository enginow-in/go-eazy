import { useState, useEffect } from 'react'

/**
 * useDebounce
 *
 * A custom React hook that delays updating a value until a specified duration (in ms)
 * has elapsed since the last time it was modified. Prevents excessive API calls,
 * unnecessary layout recalculations, and performance bottlenecks during rapid user input
 * (e.g. text inputs, search fields, or range sliders).
 *
 * @template T
 * @param {T} value - The input value to debounce.
 * @param {number} [delay=300] - Delay in milliseconds before updating debounced value.
 * @returns {T} The debounced value.
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 400)
 *
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchSearchResults(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
