import React, { useEffect } from 'react'
import { cn } from '../../utils/helpers'
import { X } from 'lucide-react'

export const Modal = ({ open, onClose, children, title, size = 'md', className = '' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && onClose) {
            onClose();
        }
    };

    if (open) {
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
    } else {
        document.body.style.overflow = 'unset';
    }

    return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
    };
}, [open, onClose]);

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
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
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
