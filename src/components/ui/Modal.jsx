import React, { useEffect } from 'react'
import { cn } from '../../utils/helpers'
import { X } from 'lucide-react'

export const Modal = ({ open, onClose, children, title, size = 'md', className = '', preventClose = false }) => {
  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Handle Escape key — respects preventClose so locked modals cannot be dismissed
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !preventClose) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, preventClose, onClose])

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
      // Backdrop click only closes if not in preventClose mode
      onClick={!preventClose ? onClose : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-white rounded-xl shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          'animate-fadeInUp',
          sizes[size],
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — X button hidden when preventClose is true */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {!preventClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {!title && !preventClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 sm:top-3 sm:right-3"
          >
            <X size={20} />
          </button>
        )}
        <div className={cn('p-5 sm:p-6', !title && !preventClose && 'pt-10 sm:pt-12')}>{children}</div>
      </div>
    </div>
  )
}
