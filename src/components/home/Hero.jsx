import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Search, TrendingUp, Shield, Star } from 'lucide-react'
import { setFilters } from '../../store/propertySlice'
import { Button } from '../ui/Button'
import { Autocomplete } from '../ui/Autocomplete'
import { CITIES } from '../../utils/constants'
import { useTranslation } from 'react-i18next'

export const Hero = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = React.useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(setFilters({ city: searchVal }))
    navigate('/search')
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
        <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 animate-fadeInUp">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
          {t('hero.trusted')}
        </div>

        {/* Logo / Heading */}
        <h1 className="font-display font-bold text-5xl md:text-7xl text-gray-900 mb-4 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          {t('hero.titlePrefix')}<span className="text-brand-500">{t('hero.titleSuffix')}</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 font-light mb-3 animate-fadeInUp" style={{ animationDelay: '150ms' }}>
          {t('hero.subtitle')}
        </p>
        <p className="text-base text-gray-400 mb-10 max-w-lg mx-auto animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          {t('hero.desc')}
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-3 mb-8 animate-fadeInUp" style={{ animationDelay: '250ms' }}>
          <Autocomplete
            id="hero-search"
            name="hero-search"
            value={searchVal}
            onChange={setSearchVal}
            suggestions={CITIES}
            placeholder={t('hero.searchPlaceholder')}
            className="flex-1"
            inputClassName="pl-11 pr-4 py-4 text-sm"
          />
          <Button type="submit" variant="primary" size="lg" className="px-7 rounded-xl shadow-md">
            {t('hero.searchBtn')}
          </Button>
        </form>

        {/* City Chips */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          {CITIES.slice(0, 8).map(city => (
            <button
              key={city}
              onClick={() => { dispatch(setFilters({ city })); navigate('/search') }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-all shadow-sm hover:shadow-md"
            >
              {city}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 animate-fadeInUp" style={{ animationDelay: '350ms' }}>
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <stat.icon size={18} className="text-brand-500" />
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
