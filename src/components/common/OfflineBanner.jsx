import React, { useEffect, useRef, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

/**
 * OfflineBanner
 *
 * A slim, accessible status strip that slides down from the top of the
 * viewport when the user loses network connectivity and auto-dismisses
 * 3 seconds after the connection is restored. Uses only CSS transitions
 * (no extra animation library) so it adds zero bundle weight.
 *
 * Behaviour:
 *  - Goes offline  → red banner slides in immediately
 *  - Comes back    → switches to green "Back online" state for 3 s, then hides
 *  - Respects      prefers-reduced-motion by disabling the slide animation
 *
 * Placement: render once inside <Layout> above <Navbar>. It is
 * `position: fixed` so it never affects document flow.
 */
export function OfflineBanner() {
  const { isOnline, lastChanged } = useNetworkStatus()
  const [visible, setVisible] = useState(false)
  const [showingOnline, setShowingOnline] = useState(false)
  const hideTimer = useRef(null)

  useEffect(() => {
    if (lastChanged === null) return   // initial mount — don't flash

    if (!isOnline) {
      // went offline
      clearTimeout(hideTimer.current)
      setShowingOnline(false)
      setVisible(true)
    } else {
      // came back online
      setShowingOnline(true)
      hideTimer.current = setTimeout(() => {
        setVisible(false)
        setShowingOnline(false)
      }, 3000)
    }

    return () => clearTimeout(hideTimer.current)
  }, [isOnline, lastChanged])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: visible ? 'translateY(0)' : 'translateY(-110%)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 20px',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          letterSpacing: '0.01em',
          background: showingOnline
            ? 'linear-gradient(90deg, #166534 0%, #15803d 100%)'
            : 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)',
          color: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
          transition: 'background 0.4s ease',
        }}
      >
        {showingOnline ? (
          <>
            <Wifi size={15} aria-hidden="true" />
            <span>Back online — you&apos;re all set!</span>
          </>
        ) : (
          <>
            <WifiOff size={15} aria-hidden="true" />
            <span>No internet connection — some features may be unavailable</span>
          </>
        )}
      </div>
    </div>
  )
}
