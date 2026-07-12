import { useEffect, useState } from 'react'

// Small manual install prompt UI.
// Browsers only surface the native install prompt after a user gesture.
// We capture it via `beforeinstallprompt` and let the user trigger it.
export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      // Prevent automatic mini-infobar from showing.
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const onInstall = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    } catch {
      // Silent fail: install prompt can fail depending on browser state.
    }
  }

  if (!deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md">
      <div className="rounded-2xl border border-black/10 bg-white/95 backdrop-blur shadow-xl p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#CA3433]">Install GoEazy</div>
            <div className="text-xs text-gray-600 truncate">
              Get offline access and add to your home screen.
            </div>
          </div>
          <button
            type="button"
            onClick={onInstall}
            className="shrink-0 rounded-xl bg-[#CA3433] text-white px-4 py-2 text-sm font-bold hover:opacity-95"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}

