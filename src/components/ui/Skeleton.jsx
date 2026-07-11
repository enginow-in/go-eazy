import React from 'react'
import { cn } from '../../utils/helpers'

export const Skeleton = ({ 
  className = '', 
  variant = 'text'
}) => {
  const variants = {
    text: 'rounded-md',
    circle: 'rounded-full',
    card: 'rounded-2xl',
    'stat-block': 'rounded-xl'
  }

  return (
    <div 
      className={cn(
        'animate-pulse bg-gray-200', 
        variants[variant],
        className
      )}
    />
  )
}

export const SharedDetailSkeleton = () => (
  <div className="pt-8 pb-20 bg-main min-h-screen">
    <div className="w-full px-4 sm:px-10 md:px-16 lg:px-20">
      {/* Back Button */}
      <Skeleton variant="text" className="h-4 w-24 mb-6" />

      {/* Mobile Slider (Hidden on Desktop) */}
      <div className="block lg:hidden w-full mb-6">
        <Skeleton variant="card" className="w-full aspect-square md:aspect-[4/3] rounded-xl sm:rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start lg:mt-6">
        {/* LEFT COLUMN: Content */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          {/* Header Card */}
          <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100/50">
            <Skeleton variant="text" className="h-10 sm:h-12 w-1/2 mb-4" />
            <div className="flex gap-2 mb-2">
              <Skeleton variant="circle" className="h-6 w-20" />
              <Skeleton variant="text" className="h-6 w-32" />
            </div>
            <Skeleton variant="text" className="h-4 w-1/3" />
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100/50 h-48">
            <Skeleton variant="text" className="h-8 w-1/4 mb-4" />
            <Skeleton variant="text" className="h-4 w-full mb-2" />
            <Skeleton variant="text" className="h-4 w-5/6 mb-2" />
            <Skeleton variant="text" className="h-4 w-4/6" />
          </div>
        </div>

        {/* RIGHT COLUMN: Slider & Actions */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          {/* Desktop Slider */}
          <div className="hidden lg:block w-full">
            <Skeleton variant="card" className="w-full aspect-square md:aspect-[4/3] rounded-xl sm:rounded-2xl" />
          </div>
          
          {/* Action Card */}
          <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-[0_2px_24px_rgb(0,0,0,0.04)] border border-gray-100/50 sticky top-24">
             <Skeleton variant="text" className="h-6 w-1/3 mb-6" />
             <Skeleton variant="card" className="h-32 w-full mb-8 bg-error-lighter/50" />
             <Skeleton variant="card" className="h-20 w-full mb-8 bg-main/50" />
             <Skeleton variant="circle" className="h-14 w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
)
