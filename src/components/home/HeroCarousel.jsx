import React, { useEffect, useState, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CAROUSEL_SLIDES } from '../../utils/constants'

export const HeroCarousel = () => {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()
  const timerRef = useRef(null)

  const slides = CAROUSEL_SLIDES || []
  const slidesCount = slides.length

  // Reset auto-play timer cleanly on manual interaction
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (slidesCount <= 1) return

    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slidesCount)
    }, 5000)
  }, [slidesCount])

  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startTimer])

  const handleNext = () => {
    setCurrent((c) => (c + 1) % slidesCount)
    startTimer()
  }

  const handlePrev = () => {
    setCurrent((c) => (c - 1 + slidesCount) % slidesCount)
    startTimer()
  }

  const handleSelect = (index) => {
    setCurrent(index)
    startTimer()
  }

  if (!slidesCount) return null

  const slide = slides[current] || {}

  return (
    <div className="relative w-full overflow-hidden rounded-3xl" style={{ height: '420px' }}>
      {/* Background Images */}
      {slides.map((s, i) => (
        <div
          key={s.id || i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img
            src={s.image}
            alt={s.title || 'Carousel slide'}
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-10 md:px-16">
        <div className="max-w-lg animate-fadeInUp">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-xs font-semibold">Live Listings Available</span>
          </div>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-3 leading-tight">
            {slide.title}
          </h2>
          <p className="text-white/80 text-base mb-6">{slide.subtitle}</p>
          <button
            onClick={() => navigate('/search')}
            className="bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all"
          >
            <span className="flex items-center gap-2">
              {slide.cta || 'Explore'} <ArrowRight size={18} />
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
      {slidesCount > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all z-10"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all z-10"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}