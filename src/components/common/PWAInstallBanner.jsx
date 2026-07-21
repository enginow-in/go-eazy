import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { usePWA } from '../../hooks/usePWA'

/**
 * PWAInstallBanner
 *
 * A polished, brand-consistent install-prompt banner that appears at the
 * bottom of the screen once the browser fires `beforeinstallprompt`.
 *
 * - Respects a "dismissed" flag in localStorage so it doesn't reappear
 *   after the user explicitly closes it.
 * - Auto-hides if the app is already installed (standalone mode).
 * - Animated entrance / exit via CSS transitions (no framer-motion dep needed).
 */
export const PWAInstallBanner = () => {
  const { canInstall, isInstalled, promptInstall } = usePWA()
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (!canInstall || isInstalled) return

    // Don't re-show if user previously dismissed
    const dismissed = localStorage.getItem('pwa_banner_dismissed')
    if (dismissed) return

    // Small delay so the banner doesn't flash in before page content
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [canInstall, isInstalled])

  const handleInstall = async () => {
    setInstalling(true)
    try {
      const outcome = await promptInstall()
      if (outcome === 'accepted') setVisible(false)
    } finally {
      setInstalling(false)
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem('pwa_banner_dismissed', '1')
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop scrim (mobile) */}
      <div
        className="fixed inset-0 bg-black/10 z-40 md:hidden"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Banner */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Install GoEazy app"
        className={[
          'fixed bottom-4 left-4 right-4 z-50',
          'md:left-auto md:right-6 md:bottom-6 md:w-80',
          'bg-white border border-gray-100 rounded-2xl',
          'shadow-[0_8px_40px_rgba(0,0,0,0.12)]',
          'p-4 flex gap-3 items-start',
          'animate-fadeInUp',
        ].join(' ')}
      >
        {/* App icon */}
        <div className="shrink-0 w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
          <Smartphone size={24} className="text-[#CA3433]" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-snug">
            Install GoEazy
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Add to your home screen for faster access and offline browsing.
          </p>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              disabled={installing}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                'bg-[#CA3433] text-white text-xs font-bold',
                'hover:bg-[#ac2d2c] transition-colors',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              <Download size={12} />
              {installing ? 'Installing…' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install banner"
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors -mt-0.5 -mr-0.5"
        >
          <X size={14} />
        </button>
      </div>
    </>
  )
}
