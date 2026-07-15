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
  }

  // Determine safe variant class styling fallback
  const selectedVariantClass = variants[variant] || variants.rectangle

  return (
    <div 
      className={cn(
        'skeleton animate-pulse bg-gray-200/80 dynamic-skeleton-block', 
        selectedVariantClass,
        className
      )}
      style={{ 
        width, 
        height: variant === 'text' && !height ? undefined : height 
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}