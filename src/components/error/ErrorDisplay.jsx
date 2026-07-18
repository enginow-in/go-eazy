import React from 'react'
import { AlertCircle } from 'lucide-react'

/**
 * Error Display Component
 * Shows validation and submission errors inline in forms
 */
export const FormError = ({ message, className = '' }) => {
  if (!message) return null
  
  return (
    <div className={`flex items-start gap-2 text-red-600 text-sm ${className}`}>
      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}

/**
 * Field-level error display
 */
export const FieldError = ({ error }) => {
  if (!error) return null
  
  return (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <AlertCircle size={12} />
      {error}
    </p>
  )
}

/**
 * Loading state with skeleton
 */
export const SkeletonLoader = ({ count = 1, className = 'h-12' }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${className} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse`}
        />
      ))}
    </div>
  )
}

/**
 * Retry Error Display
 * Shows when an error occurred with option to retry
 */
export const RetryError = ({ message, onRetry, isLoading = false }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-red-700 text-sm">{message}</p>
      </div>
      <button
        onClick={onRetry}
        disabled={isLoading}
        className="ml-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-bold transition-colors flex-shrink-0"
      >
        {isLoading ? 'Retrying...' : 'Retry'}
      </button>
    </div>
  )
}

export default {
  FormError,
  FieldError,
  SkeletonLoader,
  RetryError,
}
