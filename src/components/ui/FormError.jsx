import React from 'react'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'
import { cn } from '../../utils/helpers'

const iconMap = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
}

const colorMap = {
  error: 'bg-red-50 border-red-200 text-red-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
}

const iconColorMap = {
  error: 'text-red-500',
  success: 'text-green-500',
  info: 'text-blue-500',
}

export const FormError = ({ 
  type = 'error', 
  message, 
  className = '',
  showIcon = true 
}) => {
  if (!message) return null
  
  const Icon = iconMap[type]
  
  return (
    <div className={cn(
      'flex items-start gap-2 p-3 rounded-lg border text-sm font-medium',
      colorMap[type],
      className
    )}>
      {showIcon && Icon && (
        <Icon size={16} className={cn('mt-0.5 flex-shrink-0', iconColorMap[type])} />
      )}
      <span>{message}</span>
    </div>
  )
}

export const FormFieldError = ({ error, className }) => {
  if (!error) return null
  
  return (
    <p className={cn('text-xs text-red-500 font-medium flex items-center gap-1 mt-1', className)}>
      <AlertCircle size={12} />
      {error}
    </p>
  )
}

export const FormSuccess = ({ message, className }) => {
  if (!message) return null
  
  return (
    <FormError type="success" message={message} className={className} />
  )
}

export const FormInfo = ({ message, className }) => {
  if (!message) return null
  
  return (
    <FormError type="info" message={message} className={className} />
  )
}
