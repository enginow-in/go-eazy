import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setFilters } from '../../store/propertySlice'
import { CITIES } from '../../utils/constants'
import { cn } from '../../utils/helpers'

export const CityChips = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  // Safely extract active filter state to display active indicator highlighters
  const currentFilters = useSelector((state) => state.properties?.filters || {})
  const activeCity = currentFilters.city || ''

  const handleCity = (cityName) => {
    // Standardize filter update by merging values safely and preventing stale state retention
    dispatch(setFilters({
      ...currentFilters,
      city: cityName
    }))
    navigate('/search')
  }

  return (
    <div 
      className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide" 
      style={{ scrollbarWidth: 'none' }}
    >
      {CITIES.map((city, i) => {
        const isActive = activeCity.toLowerCase() === city.name.toLowerCase()

        return (
          <button
            key={city.name}
            onClick={() => handleCity(city.name)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm",
              "border outline-none focus-visible:ring-2 focus-visible:ring-[#CA3433]/20",
              isActive 
                ? "bg-[#CA3433] border-[#CA3433] text-white shadow-md scale-[1.02]" 
                : "bg-white border-gray-200 text-gray-700 hover:border-red-200 hover:bg-red-50/30 hover:text-[#CA3433]"
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="text-base shrink-0">{city.emoji}</span>
            <span>{city.name}</span>
          </button>
        )
      })}
    </div>
  )
}