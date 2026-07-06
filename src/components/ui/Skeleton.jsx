import React from 'react'
import { cn } from '../../utils/helpers'

export const Skeleton = ({ className = '', width, height }) => {
  return (
    <div 
      className={cn('skeleton', className)}
      style={{ width, height }}
    />
  )
}
