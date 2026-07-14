import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// Shows a refresh toast when a new Service Worker version is waiting.
// VitePWA exposes update lifecycle via a custom event.
export function PwaUpdateNotifier() {
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // vite-plugin-pwa (autoUpdate) triggers an update event.
    const handler = (event) => {
      // event.detail?.type is not always stable; be defensive.
      const type = event?.detail?.type

      // Common signal names:
      // - 'swUpdated'
      // - 'updated'
      // - 'waiting'
      const looksLikeUpdate =
        type === 'swUpdated' || type === 'updated' || type === 'waiting'

      if (hasShown) return
      if (!looksLikeUpdate && type) return

      setHasShown(true)
      toast('New version available — tap to refresh.', {
        duration: 6000,
        // @ts-ignore
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload(),
        },
      })
    }

    // VitePWA uses 'vite:pwa-updated' in modern versions.
    window.addEventListener('vite:pwa-updated', handler)

    // Fallback: some setups dispatch 'pwa:update' or similar.
    window.addEventListener('pwa:update', handler)

    return () => {
      window.removeEventListener('vite:pwa-updated', handler)
      window.removeEventListener('pwa:update', handler)
    }
  }, [hasShown])

  return null
}

