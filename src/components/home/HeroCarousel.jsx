import React, { useEffect, useState, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CAROUSEL_SLIDES } from '../../utils/constants'

// Module-level constant — avoids re-evaluating CAROUSEL_SLIDES.length inside the component
// and ensures startTimer's useCallback dependency is a stable primitive.
const SLIDE_COUNT = CAROUSEL_SLIDES.length
const INTERVAL_MS = 5000

export const HeroCarousel = () => {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()
  const timerRef = useRef(null)

  // Start (or restart) the auto-play timer.
  // Using useRef + useCallback ensures the interval is reset cleanly on any manual
  // interaction, preventing double-advance when a click coincides with an interval tick.
  // SLIDE_COUNT is module-level so this callback is stable across renders.
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDE_COUNT)
    }, INTERVAL_MS)
  }, []) // stable — SLIDE_COUNT is a module-level constant, not a prop or state

  useEffect(() => {
    startTimer()
    return () => clearInterval(timerRef.current)
  }, [startTimer])

  const handlePrev = () => {
    setCurrent(c => (c - 1 + SLIDE_COUNT) % SLIDE_COUNT)
    startTimer()
  }

  const handleNext = () => {
    setCurrent(c => (c + 1) % SLIDE_COUNT)
    startTimer()
  }

  const handleDot = (i) => {
    setCurrent(i)
    startTimer()
  }

  const slide = CAROUSEL_SLIDES[current]

  return (
    <div className="relative w-full overflow-hidden rounded-3xl" style={{ height: '420px' }}>
      {CAROUSEL_SLIDES.map((s, i) => {
        const isActive = i === current
        return (
          <div
            key={s.id}
            // pointer-events-none on inactive slides prevents invisible layers from
            // intercepting clicks/taps meant for foreground controls.
            className={`absolute inset-0 transition-opacity duration-700 ${
              isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            // aria-hidden must be a boolean, not a conditional expression that
            // could evaluate to `false` (which React keeps as an attribute value).
            aria-hidden={!isActive}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${SLIDE_COUNT}: ${s.title}`}
          >
            <img
              src={s.image}
              alt={s.title}
              className="w-full h-full object-cover"
              // First slide should be eager-loaded for optimal LCP.
              // Subsequent slides can be lazy-loaded since they are off-screen.
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          </div>
        )
      })}

      {/* Content overlay */}
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
              {slide.cta} <ArrowRight size={18} />
            </span>
          </button>
        </div>
      </div>

      {/* Prev / Next controls */}
      <button
        onClick={handlePrev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all z-10"
      >
        <ChevronLeft size={20} className="text-gray-700" />
      </button>
      <button
        onClick={handleNext}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all z-10"
      >
        <ChevronRight size={20} className="text-gray-700" />
      </button>

      {/* Dot navigation */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10"
        role="tablist"
        aria-label="Carousel slide navigation"
      >
        {CAROUSEL_SLIDES.map((s, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-controls={`carousel-slide-${i}`}
            aria-label={`Go to slide ${i + 1}: ${s.title}`}
            onClick={() => handleDot(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
