/**
 * Toast Configuration
 * Centralizes toast styling and default settings for consistent notifications
 */

import toast from 'react-hot-toast'

// Default toast styling
const defaultStyle = {
  fontSize: '14px',
  fontWeight: '500',
}

// Success toast
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    style: defaultStyle,
    duration: 4000,
    ...options,
  })
}

// Error toast
export const showError = (message, options = {}) => {
  return toast.error(message, {
    style: defaultStyle,
    duration: 5000,
    ...options,
  })
}

// Loading/Promise toast
export const showLoading = (promise, messages = {}) => {
  return toast.promise(
    promise,
    {
      loading: {
        render: messages.loading || 'Loading...',
        icon: '⏳',
        style: defaultStyle,
      },
      success: {
        render: messages.success || 'Success!',
        icon: '✅',
        style: defaultStyle,
      },
      error: {
        render({ data }) {
          return messages.error || data?.message || 'Something went wrong'
        },
        icon: '❌',
        style: defaultStyle,
      },
    }
  )
}

// Info toast
export const showInfo = (message, options = {}) => {
  return toast((t) => (
    <div className="flex items-center gap-2">
      <span className="text-lg">ℹ️</span>
      <span>{message}</span>
    </div>
  ), {
    style: defaultStyle,
    duration: 4000,
    ...options,
  })
}

// Warning toast
export const showWarning = (message, options = {}) => {
  return toast((t) => (
    <div className="flex items-center gap-2">
      <span className="text-lg">⚠️</span>
      <span>{message}</span>
    </div>
  ), {
    style: defaultStyle,
    duration: 5000,
    ...options,
  })
}

// Dismiss all toasts
export const dismissAll = () => {
  toast.remove()
}

// Custom toast with button
export const showCustom = (message, buttonText, onButtonClick, options = {}) => {
  return toast.custom((t) => (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-gray-700 flex-1">{message}</p>
        <button
          onClick={() => {
            onButtonClick()
            toast.dismiss(t.id)
          }}
          className="bg-[#CA3433] hover:bg-[#ac2d2c] text-white px-3 py-1 rounded text-xs font-bold whitespace-nowrap transition-colors"
        >
          {buttonText}
        </button>
      </div>
    </div>
  ), {
    duration: 0, // Don't auto-dismiss
    ...options,
  })
}

export default {
  showSuccess,
  showError,
  showLoading,
  showInfo,
  showWarning,
  dismissAll,
  showCustom,
}
