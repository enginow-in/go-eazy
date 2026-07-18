import { useState, useEffect } from 'react';

/**
 * Custom hook to manage recent search terms using localStorage.
 * Provides deduplication, a maximum of 10 entries, and safe handling for environments where localStorage may be unavailable.
 */
export default function useRecentSearches() {
  const STORAGE_KEY = 'recentSearches';
  const MAX_ITEMS = 10;
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
    } catch (e) {
      // Fail silently – localStorage might be disabled (e.g., privacy mode)
      console.warn('Unable to access localStorage for recent searches:', e);
    }
  }, []);

  const saveToStorage = (items) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to write recent searches to localStorage:', e);
    }
  };

  const addSearch = (term) => {
    if (!term) return;
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((t) => t !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, MAX_ITEMS);
      saveToStorage(updated);
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear recent searches from localStorage:', e);
    }
  };

  return { recentSearches, addSearch, clearRecentSearches };
}
