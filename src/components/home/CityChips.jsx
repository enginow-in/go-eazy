import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setFilters } from '../../store/propertySlice'
import { CITIES } from '../../utils/constants'
import { useTranslation } from 'react-i18next'

const CITY_EMOJIS = {
  Dehradun: '🏔️',
  Srinagar: '🏞️',
  Rishikesh: '🧘',
  Haldwani: '🌲',
  Nainital: '⛵',
  Haridwar: '🪔',
  Roorkee: '🎓',
  Rudrapur: '🏭'
}

export const CityChips = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const handleCity = (city) => {
    dispatch(setFilters({ city }))
    navigate('/search')
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {CITIES.map((city, i) => (
        <button
          key={city}
          onClick={() => handleCity(city)}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition-all shadow-sm hover:shadow-md"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className="text-base">{CITY_EMOJIS[city] || '📍'}</span>
          {t(`cities.${city}`) || city}
        </button>
      ))}
    </div>
  )
}
