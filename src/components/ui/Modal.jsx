import React, { useEffect, useId, useRef } from 'react'
import { cn } from '../../utils/helpers'
import { X } from 'lucide-react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export const Modal = ({ open, onClose, children, title, size = 'md', className = '', preventClose = false }) => {
  const dialogRef = useRef(null)
  const previouslyFocusedElementRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const preventCloseRef = useRef(preventClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    preventCloseRef.current = preventClose
  }, [preventClose])

  useEffect(() => {
    if (!open) return

    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusDialog = () => {
      const dialog = dialogRef.current
      if (!dialog) return

      const focusableElements = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter((element) => element instanceof HTMLElement && !element.hasAttribute('disabled'))

      const initialFocusTarget = focusableElements[0] || dialog
      initialFocusTarget.focus({ preventScroll: true })
    }

    const handleKeyDown = (event) => {
      const dialog = dialogRef.current
      if (!dialog) return

      if (event.key === 'Escape') {
        if (!preventCloseRef.current && onCloseRef.current) {
          event.preventDefault()
          onCloseRef.current()
        }
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter((element) => element instanceof HTMLElement && !element.hasAttribute('disabled'))

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialog.focus({ preventScroll: true })
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey) {
        if (activeElement === firstElement || !dialog.contains(activeElement)) {
          event.preventDefault()
          lastElement.focus({ preventScroll: true })
        }
        return
      }

      if (activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus({ preventScroll: true })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const animationFrameId = window.requestAnimationFrame(focusDialog)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow

      const previouslyFocusedElement = previouslyFocusedElementRef.current
      if (previouslyFocusedElement && document.contains(previouslyFocusedElement)) {
        previouslyFocusedElement.focus({ preventScroll: true })
      }
    }
  }, [open])

  if (!open) return null
  const showCloseButton = !preventClose && typeof onClose === 'function'

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
      onClick={() => {
        if (showCloseButton) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? 'Dialog' : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-white rounded-xl shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          'animate-fadeInUp',
          sizes[size],
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 id={titleId} className="text-lg font-bold text-gray-900">{title}</h2>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CA3433] focus-visible:ring-offset-2"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {!title && showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-2 right-2 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 sm:top-3 sm:right-3"
          >
            <X size={20} />
          </button>
        )}
        <div className={cn('p-5 sm:p-6', !title && 'pt-10 sm:pt-12')}>{children}</div>
      </div>
    </div>
  )
}
