import React from 'react'
import { cn } from '../../utils/helpers'
import { Home, Building, Tent, MapPin } from 'lucide-react'

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default:  'bg-gray-100 text-gray-700',
    brand:    'bg-brand-100 text-brand-700',
    accent:   'bg-accent-100 text-accent-700',
    success:  'bg-green-100 text-green-700',
    warning:  'bg-yellow-100 text-yellow-700',
    danger:   'bg-red-100 text-red-700',
    purple:   'bg-purple-100 text-purple-700',
    ghost:    'bg-transparent text-gray-700 p-0 shadow-none',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
      variants[variant] || variants.default, className
    )}>
      {children}
    </span>
  )
}

export const TypeBadge = ({ type, variant: customVariant }) => {
  // Normalize lookup key to protect against case-sensitivity issues from database values
  const normalizedType = type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : ''

  const map = {
    Room:   { variant: 'brand',   icon: <Home size={12} /> },
    Flat:   { variant: 'success', icon: <Building size={12} /> },
    Hostel: { variant: 'warning', icon: <Tent size={12} /> },
    Pg:     { variant: 'purple',  icon: <Building size={12} /> },
  }

  const { variant = 'default', icon = <MapPin size={12} /> } = map[normalizedType] || {}

  return (
    <Badge variant={customVariant || variant}>
      {icon} 
      <span>{normalizedType || type || 'Property'}</span>
    </Badge>
  )
}