import React, { useEffect, useRef, useCallback } from 'react'
import { cn } from '../../utils/helpers'
import { X } from 'lucide-react'

export const Modal = ({ open, onClose, children, title, size = 'md', className = '' }) => {
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  // Lock body scroll and manage focus when modal opens/closes
  useEffect(() => {
    if (open) {
      // Save the element that had focus before the modal opened
      previousFocusRef.current = document.activeElement
      document.body.style.overflow = 'hidden'

      // Focus the modal container for screen readers
      requestAnimationFrame(() => {
        modalRef.current?.focus()
      })
    } else {
      document.body.style.overflow = ''

      // Restore focus to the element that triggered the modal
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
      }
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Trap focus inside modal and handle Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }

    // Focus trap: cycle through focusable elements
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
  }, [onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  }

  // Generate a unique ID for aria-labelledby
  const titleId = title ? 'modal-title' : undefined

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-white rounded-xl shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          'animate-fadeInUp',
          'focus:outline-none',
          sizes[size],
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 id={titleId} className="text-lg font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
              aria-label="Close dialog"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 sm:top-3 sm:right-3"
            aria-label="Close dialog"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
        <div className={cn('p-5 sm:p-6', !title && 'pt-10 sm:pt-12')}>{children}</div>
      </div>
    </div>
  )
}
