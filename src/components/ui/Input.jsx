import React, { forwardRef, useId } from 'react'
import { cn } from '../../utils/helpers'

// ── Shared Helper Icon ────────────────────────────────────────────────────────
const DownArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 pointer-events-none">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)

// ── Input Component ───────────────────────────────────────────────────────────
export const Input = forwardRef(({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  wrapperClassName = '',
  ...props
}, ref) => {
  const generatedId = useId()
  const id = props.id || generatedId

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900',
            'placeholder:text-gray-400 outline-none',
            'transition-all duration-200',
            'border-gray-200 focus:border-[#CA3433] focus:ring-4 focus:ring-[#CA3433]/10',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-[#CA3433] focus:border-[#CA3433] focus:ring-[#CA3433]/10',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[#CA3433] font-medium animate-in fade-in duration-150">{error}</p>}
    </div>
  )
})
Input.displayName = 'Input'

// ── Textarea Component ────────────────────────────────────────────────────────
export const Textarea = forwardRef(({ label, error, className = '', wrapperClassName = '', ...props }, ref) => {
  const generatedId = useId()
  const id = props.id || generatedId
  
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', wrapperClassName)}>
      {label && <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900',
          'placeholder:text-gray-400 outline-none resize-none',
          'transition-all duration-200',
          'border-gray-200 focus:border-[#CA3433] focus:ring-4 focus:ring-[#CA3433]/10',
          'disabled:bg-gray-50 disabled:cursor-not-allowed',
          error && 'border-[#CA3433] focus:border-[#CA3433] focus:ring-[#CA3433]/10',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#CA3433] font-medium animate-in fade-in duration-150">{error}</p>}
    </div>
  )
})
Textarea.displayName = 'Textarea'

// ── Select Component ──────────────────────────────────────────────────────────
export const Select = forwardRef(({ label, error, children, className = '', wrapperClassName = '', ...props }, ref) => {
  const generatedId = useId()
  const id = props.id || generatedId

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', wrapperClassName)}>
      {label && <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>}
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border bg-white pl-4 pr-10 py-3 text-sm text-gray-900',
            'outline-none appearance-none cursor-pointer',
            'transition-all duration-200',
            'border-gray-200 focus:border-[#CA3433] focus:ring-4 focus:ring-[#CA3433]/10',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            error && 'border-[#CA3433] focus:border-[#CA3433] focus:ring-[#CA3433]/10',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center">
          <DownArrowIcon />
        </div>
      </div>
      {error && <p className="text-xs text-[#CA3433] font-medium animate-in fade-in duration-150">{error}</p>}
    </div>
  )
})
Select.displayName = 'Select'