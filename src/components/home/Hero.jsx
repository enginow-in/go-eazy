import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Search, TrendingUp, Shield, Star } from 'lucide-react'
import { setFilters } from '../../store/propertySlice'
import { Button } from '../ui/Button'
import { CITIES } from '../../utils/constants'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/helpers'

export const Hero = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = React.useState('')
  
  // Safely inherit existing global filter metrics to prevent payload drops
  const currentFilters = useSelector((state) => state.properties?.filters || {})

  const triggerSearchPipeline = (cityName) => {
    dispatch(setFilters({
      ...currentFilters,
      city: cityName
    }))
    navigate('/search')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchVal.trim()) return
    triggerSearchPipeline(searchVal.trim())
  }

  const stats = [
    { icon: TrendingUp, value: '10,000+', label: t('hero.stats.listings') },
    { icon: Star, value: '4.9', label: t('hero.stats.rating') },
    { icon: Shield, value: '100%', label: t('hero.stats.verified') },
  ]

  return (
    <section className="hero-gradient pt-32 pb-12">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-red-50 text-[#CA3433] rounded-full px-4 py-1.5 text-sm font-semibold mb-6 animate-fadeInUp border border-red-100">
          <span className="w-2 h-2 bg-[#CA3433] rounded-full animate-pulse" />
          {t('hero.trusted')}
        </div>

        {/* Logo / Heading */}
        <h1 className="font-display font-bold text-5xl md:text-7xl text-gray-900 mb-4 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          {t('hero.titlePrefix')}<span className="text-[#CA3433]">{t('hero.titleSuffix')}</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 font-light mb-3 animate-fadeInUp" style={{ animationDelay: '150ms' }}>
          {t('hero.subtitle')}
        </p>
        <p className="text-base text-gray-400 mb-10 max-w-lg mx-auto animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          {t('hero.desc')}
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-3 mb-8 animate-fadeInUp" style={{ animationDelay: '250ms' }}>
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              type="text"
              id="hero-search"
              name="hero-search"
              placeholder={t('hero.searchPlaceholder')}
              className="w-full pl-11 pr-4 py-4 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:border-[#CA3433] focus:ring-4 focus:ring-[#CA3433]/10 text-gray-900 text-sm transition-all"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" className="px-7 rounded-xl shadow-md">
            {t('hero.searchBtn')}
          </Button>
        </form>

        {/* City Chips */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          {CITIES.slice(0, 8).map(city => (
            <button
              key={city.name}
              onClick={() => triggerSearchPipeline(city.name)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:border-red-200 hover:text-[#CA3433] hover:bg-red-50/30 transition-all shadow-sm hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-[#CA3433]/20"
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 animate-fadeInUp" style={{ animationDelay: '350ms' }}>
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50/50 flex items-center justify-center border border-red-50">
                <stat.icon size={18} className="text-[#CA3433]" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}