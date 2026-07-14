import React from 'react'
import { cn } from '../../utils/helpers'

const variants = {
  primary:   'bg-[#CA3433] hover:bg-[#ac2d2c] text-white shadow-sm hover:shadow-md transition-all duration-300',
  secondary: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-sm',
  ghost:     'bg-transparent hover:bg-gray-100 text-gray-700',
  danger:    'bg-red-500 hover:bg-red-600 text-white',
  accent:    'bg-accent-500 hover:bg-accent-600 text-white shadow-sm hover:shadow-md',
  outline:   'border-2 border-[#CA3433] text-[#CA3433] hover:bg-[#fff5f5]',
}

const sizes = {
  sm:  'px-3 py-1.5 text-sm rounded-lg',
  md:  'px-5 py-2.5 text-sm rounded-xl',
  lg:  'px-7 py-3.5 text-base rounded-xl',
  xl:  'px-8 py-4 text-lg rounded-2xl',
  icon:'p-2 rounded-xl',
}

const ButtonComponent = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}

export const Button = React.memo(ButtonComponent)
