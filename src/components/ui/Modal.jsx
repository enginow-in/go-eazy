import React, { useEffect, useRef, useId } from 'react'
import { cn } from '../../utils/helpers'
import { X } from 'lucide-react'

export const Modal = ({
  open,
  onClose,
  children,
  title,
  size = 'md',
  className = '',
}) => {
  const modalRef = useRef(null)
  const previouslyFocusedElement = useRef(null)

  const titleId = useId()
  const descriptionId = useId()

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close modal with Escape key
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  // Focus management and focus trapping
  useEffect(() => {
    if (!open || !modalRef.current) return

    // Save the element that opened the modal
    previouslyFocusedElement.current = document.activeElement

    const focusableElements = modalRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    // If no focusable elements, focus the dialog itself
    if (!focusableElements.length) {
      modalRef.current.focus()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    firstElement.focus()

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)

    return () => {
      document.removeEventListener('keydown', handleTabKey)

      // Restore focus to the element that opened the modal (if still in the DOM)
      const element = previouslyFocusedElement.current
      if (
        element &&
        typeof element.focus === 'function' &&
        document.contains(element)
      ) {
        element.focus()
      }
    }
  }, [open])

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
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-white rounded-xl shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          'animate-fadeInUp',
          sizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2
              id={titleId}
              className="text-lg font-bold text-gray-900"
            >
              {title}
            </h2>

            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute top-2 right-2 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 sm:top-3 sm:right-3"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}

        <div
          id={descriptionId}
          className={cn('p-5 sm:p-6', !title && 'pt-10 sm:pt-12')}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
