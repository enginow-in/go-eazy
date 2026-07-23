import { useState, useEffect } from 'react'

/**
 * useNetworkStatus
 *
 * Tracks the browser's online/offline state using the Navigator API and
 * window `online`/`offline` events. Exposes both the current status and
 * the timestamp of the most recent transition so consumers can display
 * "Back online" confirmation messages with timing context.
 *
 * @returns {{ isOnline: boolean, lastChanged: Date | null }}
 *
 * @example
 * const { isOnline } = useNetworkStatus()
 * if (!isOnline) return <OfflineBanner />
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [lastChanged, setLastChanged] = useState(null)

  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true);  setLastChanged(new Date()) }
    const handleOffline = () => { setIsOnline(false); setLastChanged(new Date()) }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, lastChanged }
}
