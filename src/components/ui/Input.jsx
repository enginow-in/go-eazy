import React, { useId } from 'react'
import { cn } from '../../utils/helpers'

export const Input = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  wrapperClassName = '',
  ref,
  ...props
}) => {
  const generatedId = useId()
  const id = props.id || generatedId

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[#CA3433] font-medium">{error}</p>}
    </div>
  )
}
Input.displayName = 'Input'

export const Textarea = ({ label, error, className = '', ref, ...props }) => {
  const generatedId = useId()
  const id = props.id || generatedId
  
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>}
      <textarea
        ref={ref}
        id={id}
      className={cn(
        'w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900',
        'placeholder:text-gray-400 outline-none resize-none',
        'transition-all duration-200',
        'border-gray-200 focus:border-brand-400 focus:ring-3 focus:ring-brand-100',
        error && 'border-red-400',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
  </div>
  )
}
Textarea.displayName = 'Textarea'

export const Select = ({ label, error, children, className = '', ref, ...props }) => {
  const generatedId = useId()
  const id = props.id || generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>}
      <select
        ref={ref}
        id={id}
      className={cn(
        'w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900',
        'outline-none appearance-none cursor-pointer',
        'transition-all duration-200',
        'border-gray-200 focus:border-brand-400 focus:ring-3 focus:ring-brand-100',
        error && 'border-red-400',
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
  </div>
  )
}
Select.displayName = 'Select'
