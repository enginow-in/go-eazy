import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/helpers'

export const LazyImage = ({
  src,
  alt = '',
  className = '',
  placeholderClassName = '',
  fallbackSrc = 'https://ui-avatars.com/api/?name=GoEazy&background=f3f4f6&color=9ca3af',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = (e) => {
    setIsLoaded(true)
    onLoad?.(e)
  }

  const handleError = (e) => {
    setHasError(true)
    if (e.target.src !== fallbackSrc) {
      e.target.src = fallbackSrc
    }
    onError?.(e)
  }

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)} {...props}>
      {!isLoaded && (
        <div className={cn(
          'absolute inset-0 bg-gray-100 animate-pulse',
          placeholderClassName
        )} />
      )}
      {isInView && (
        <img
          src={hasError ? fallbackSrc : src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  )
}
