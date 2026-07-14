import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CAROUSEL_SLIDES } from '../../utils/constants'

export const HeroCarousel = () => {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer = null

    const stopAutoplay = () => {
      if (timer === null) return
      clearInterval(timer)
      timer = null
    }

    const syncAutoplay = () => {
      stopAutoplay()
      if (document.hidden || reducedMotion.matches || CAROUSEL_SLIDES.length <= 1) return

      timer = setInterval(() => {
        setCurrent(c => (c + 1) % CAROUSEL_SLIDES.length)
      }, 5000)
    }

    syncAutoplay()
    document.addEventListener('visibilitychange', syncAutoplay)
    reducedMotion.addEventListener('change', syncAutoplay)

    return () => {
      stopAutoplay()
      document.removeEventListener('visibilitychange', syncAutoplay)
      reducedMotion.removeEventListener('change', syncAutoplay)
    }
  }, [])

  const slide = CAROUSEL_SLIDES[current]

  return (
    <div className="relative w-full overflow-hidden rounded-3xl" style={{ height: '420px' }}>
      {CAROUSEL_SLIDES.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover"
            loading="lazy"
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
              {slide.cta} <ArrowRight size={18} />
            </span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={() => setCurrent(c => (c - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all z-10"
      >
        <ChevronLeft size={20} className="text-gray-700" />
      </button>
      <button
        onClick={() => setCurrent(c => (c + 1) % CAROUSEL_SLIDES.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all z-10"
      >
        <ChevronRight size={20} className="text-gray-700" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {CAROUSEL_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
