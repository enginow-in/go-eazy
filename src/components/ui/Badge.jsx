import { cn } from '../../utils/helpers'
import { Home, Building, Tent, MapPin } from 'lucide-react'

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    brand:    'bg-brand-100 text-brand-700',
    success:  'bg-green-100 text-green-700',
    warning:  'bg-yellow-100 text-yellow-700',
    purple:   'bg-purple-100 text-purple-700',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
      variants[variant], className
    )}>
      {children}
    </span>
  )
}

export const TypeBadge = ({ type, variant: customVariant }) => {
  const map = {
    Room:   { variant: 'brand',   icon: <Home size={12} /> },
    Flat:   { variant: 'success', icon: <Building size={12} /> },
    Hostel: { variant: 'warning', icon: <Tent size={12} /> },
    PG:     { variant: 'purple',  icon: <Building size={12} /> },
  }
  const { variant = 'default', icon = <MapPin size={12} /> } = map[type] || {}
  return <Badge variant={customVariant || variant}>{icon} {type}</Badge>
}
