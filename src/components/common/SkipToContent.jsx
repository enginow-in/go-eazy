import React from 'react'

/**
 * SkipToContent — Accessibility component that allows keyboard users
 * to skip past the navigation and jump directly to the main content.
 * 
 * This is invisible by default and only appears when focused via Tab key.
 * It's a WCAG 2.1 Level A requirement (Success Criterion 2.4.1).
 */
const SkipToContent = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-6 focus:py-3 focus:bg-[#CA3433] focus:text-white focus:rounded-full focus:text-sm focus:font-semibold focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#CA3433] transition-all"
    >
      Skip to main content
    </a>
  )
}

export default SkipToContent
