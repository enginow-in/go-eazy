import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Search } from 'lucide-react'
import { CITIES, MOCK_PROPERTIES } from '../../utils/constants'

// Extract all unique areas from mock listings with their associated cities
const ALL_AREAS = Array.from(
  new Map(
    (MOCK_PROPERTIES || [])
      .filter(p => p.area && p.city)
      .map(p => [`${p.area.toLowerCase().trim()}_${p.city.toLowerCase().trim()}`, {
        name: p.area,
        city: p.city
      }])
  ).values()
)

export const LocationAutocomplete = ({
  value = '',
  onChange,
  placeholder = 'Select location',
  mode = 'city', // 'city' or 'area'
  selectedCity = '', // to filter areas if city is selected
  className = '',
  inputClassName = 'w-full bg-transparent border-none text-sm py-2.5 px-3 focus:ring-0 outline-none placeholder:text-gray-400',
  showIcon = true
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)

  // Get matching suggestions based on mode and query value
  const getSuggestions = (query) => {
    const cleanQuery = (query || '').toLowerCase().trim()

    if (mode === 'city') {
      // Suggest from static cities list
      if (!cleanQuery) {
        // Show default popular cities when input is empty but open
        return CITIES.slice(0, 5).map(c => ({ label: c, value: c }))
      }
      return CITIES
        .filter(c => c.toLowerCase().includes(cleanQuery))
        .map(c => ({ label: c, value: c }))
    } else {
      // Suggest from areas list
      let filteredAreas = ALL_AREAS
      if (selectedCity) {
        filteredAreas = ALL_AREAS.filter(a => a.city.toLowerCase() === selectedCity.toLowerCase())
      }

      if (!cleanQuery) {
        // Suggest top 5 areas
        return filteredAreas.slice(0, 5).map(a => ({
          label: selectedCity ? a.name : `${a.name}, ${a.city}`,
          value: a.name,
          city: a.city
        }))
      }

      return filteredAreas
        .filter(a => a.name.toLowerCase().includes(cleanQuery) || a.city.toLowerCase().includes(cleanQuery))
        .map(a => ({
          label: selectedCity ? a.name : `${a.name}, ${a.city}`,
          value: a.name,
          city: a.city
        }))
    }
  }

  // Update suggestions whenever value or selectedCity changes
  useEffect(() => {
    setSuggestions(getSuggestions(value))
    setActiveIndex(-1)
  }, [value, selectedCity, mode])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex])
        } else if (suggestions.length > 0) {
          // Select the first one by default if user just hits enter
          handleSelect(suggestions[0])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      default:
        break
    }
  }

  const handleSelect = (item) => {
    onChange(item)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center bg-transparent w-full">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange({ value: e.target.value, isTyping: true })
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={inputClassName}
        />
        {showIcon && (
          <div className="text-gray-400 mr-2 flex items-center justify-center pointer-events-none">
            <MapPin size={14} className="opacity-60" />
          </div>
        )}
      </div>

      {/* Floating suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-[150] max-h-60 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1.5">
            {mode === 'city' ? 'Suggested Cities' : 'Suggested Localities'}
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={`${item.value}-${idx}`}
              type="button"
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2.5 transition-all ${
                idx === activeIndex
                  ? 'bg-red-50 text-[#CA3433]'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MapPin size={12} className={idx === activeIndex ? 'text-[#CA3433]' : 'text-gray-400'} />
              <div className="flex-1 flex justify-between items-center">
                <span>{item.label}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  {mode === 'city' ? 'City' : 'Area'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
