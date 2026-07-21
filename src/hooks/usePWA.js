/**
 * usePWA — Progressive Web App install prompt hook
 *
 * Captures the browser's `beforeinstallprompt` event, exposes a
 * `promptInstall()` helper, and tracks whether the app is already
 * running as a standalone installed PWA.
 *
 * Usage:
 *   const { canInstall, isInstalled, promptInstall } = usePWA()
 */
import { useState, useEffect, useCallback } from 'react'

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detect standalone mode (already installed)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (standalone) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstall = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setCanInstall(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    // Whether accepted or dismissed, the prompt can only be used once
    setDeferredPrompt(null)
    if (outcome === 'accepted') {
      setCanInstall(false)
      setIsInstalled(true)
    }

    return outcome
  }, [deferredPrompt])

  return { canInstall, isInstalled, promptInstall }
}
