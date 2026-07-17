import React from 'react'
import { cn } from '../../utils/helpers'

const variantStyles = {
  rectangle: 'rounded-xl',
  circle: 'rounded-full',
  text: 'rounded-md h-4 w-full',
  heading: 'rounded-md h-6 w-3/4',
  avatar: 'rounded-full h-10 w-10',
  button: 'rounded-xl h-10 w-24',
  card: 'rounded-2xl h-48 w-full',
  badge: 'rounded-full h-5 w-16',
}

export const Skeleton = ({ 
  className = '', 
  variant = 'rectangle', 
  width, 
  height,
  'aria-label': ariaLabel,
  ...props
}) => {
  return (
    <div 
      className={cn(
        'skeleton',
        variantStyles[variant],
        className
      )}
      style={{ width, height }}
      role="presentation"
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      {...props}
    />
  )
}

export const PropertyCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
    <Skeleton variant="card" className="!h-48 !rounded-none" />
    <div className="p-4 space-y-3">
      <Skeleton variant="heading" />
      <Skeleton variant="text" />
      <Skeleton variant="text" className="!w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="badge" />
        <Skeleton variant="badge" />
      </div>
    </div>
  </div>
)

export const ServiceCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-4">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="heading" className="!w-1/2" />
        <Skeleton variant="text" className="!w-1/3" />
      </div>
    </div>
    <Skeleton variant="text" />
    <Skeleton variant="text" className="!w-2/3" />
  </div>
)

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} variant="card" className="!h-24" />
      ))}
    </div>
    <Skeleton variant="card" className="!h-64" />
  </div>
)
