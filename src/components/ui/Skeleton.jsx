import React from 'react'
import { cn } from '../../utils/helpers'

export const Skeleton = ({ 
  className = '', 
  variant = 'rectangle', 
  width, 
  height 
}) => {
  const variants = {
    rectangle: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md h-4 w-full',
    heading: 'rounded-md h-6 w-3/4',
    badge: 'rounded-full h-5 w-16',
  }

  return (
    <div 
      className={cn(
        'animate-pulse bg-gray-200',
        variants[variant],
        className
      )}
      style={{ width, height }}
    />
  )
}

export const PropertyCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
    <Skeleton className="w-full h-48" />
    <div className="p-4 space-y-3">
      <Skeleton variant="heading" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <div className="flex gap-2">
        <Skeleton variant="badge" />
        <Skeleton variant="badge" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton variant="heading" className="w-1/3" />
        <Skeleton variant="badge" className="w-20" />
      </div>
    </div>
  </div>
)

export const ServiceCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
    <Skeleton className="w-full h-40" />
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="heading" className="w-2/3" />
          <Skeleton variant="text" className="w-1/3" />
        </div>
      </div>
      <Skeleton variant="text" />
      <Skeleton variant="badge" className="w-24" />
    </div>
  </div>
)

export const PropertyDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="w-full h-96" />
        <div className="space-y-4">
          <Skeleton variant="heading" className="w-1/2" />
          <Skeleton variant="text" />
          <Skeleton variant="text" className="w-3/4" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="w-full h-64" />
        <Skeleton className="w-full h-48" />
      </div>
    </div>
  </div>
)

export const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="w-full h-32" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  </div>
)
