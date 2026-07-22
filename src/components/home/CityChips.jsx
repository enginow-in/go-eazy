import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setFilters, resetFilters } from '../../store/propertySlice'
import { CITIES } from '../../utils/constants'

export const CityChips = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleCity = (city) => {
    dispatch(resetFilters())
    dispatch(setFilters({ city }))
    navigate('/search')
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {CITIES.map((city, i) => (
        <button
          key={city.name}
          onClick={() => handleCity(city.name)}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition-all shadow-sm hover:shadow-md"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className="text-base">{city.emoji}</span>
          {city.name}
        </button>
      ))}
    </div>
  )
}
