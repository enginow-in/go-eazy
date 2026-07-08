import React, { useEffect, useRef } from 'react'
import { cn } from '../../utils/helpers'
import { X } from 'lucide-react'

export const Modal = ({ open, onClose, children, title, size = 'md', className = '' }) => {
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      previousFocusRef.current = document.activeElement
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus()
        }
      }, 10)
    } else {
      document.body.style.overflow = ''
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements.length === 0) return
      
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
  }

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative w-full bg-white rounded-xl shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          'animate-fadeInUp focus:outline-none',
          sizes[size],
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 id="modal-title" className="text-lg font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-2 right-2 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 sm:top-3 sm:right-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={20} />
          </button>
        )}
        <div className={cn('p-5 sm:p-6', !title && 'pt-10 sm:pt-12')}>{children}</div>
      </div>
    </div>
  )
}
