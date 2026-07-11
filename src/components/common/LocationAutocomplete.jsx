import React from 'react'
import { Search, MapPin } from 'lucide-react'

/**
 * LocationAutocomplete
 *
 * A generic, accessible autocomplete input for picking a city/locality.
 *
 * By default it filters a static list of strings (the CITIES constant),
 * but you can pass a `fetchSuggestions` function instead to swap in a
 * live provider (Google Places, OpenStreetMap/Nominatim, etc.) without
 * changing anything else about this component's usage:
 *
 *   <LocationAutocomplete
 *     value={val}
 *     onChange={setVal}
 *     onSelect={(v) => ...}
 *     fetchSuggestions={async (query) => {
 *       const res = await fetch(`/api/places?q=${query}`)
 *       return (await res.json()).map(p => p.description)
 *     }}
 *   />
 */
export const LocationAutocomplete = ({
  value,
  onChange,
  onSelect,
  suggestions = [],
  fetchSuggestions = null,
  placeholder = 'Search by city or area',
  id = 'location-autocomplete',
  className = '',
  inputClassName = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [options, setOptions] = React.useState([])
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const containerRef = React.useRef(null)
  const listboxId = `${id}-listbox`

  // Compute matching options whenever the value changes.
  React.useEffect(() => {
    let cancelled = false

    const updateOptions = async () => {
      const query = (value || '').trim().toLowerCase()

      if (!query) {
        setOptions([])
        setIsOpen(false)
        return
      }

      let matches
      if (fetchSuggestions) {
        matches = await fetchSuggestions(query)
      } else {
        matches = suggestions.filter(item =>
          item.toLowerCase().includes(query)
        )
      }

      if (!cancelled) {
        setOptions(matches.slice(0, 8))
        setIsOpen(matches.length > 0)
        setHighlightedIndex(-1)
      }
    }

    updateOptions()
    return () => { cancelled = true }
  }, [value, suggestions, fetchSuggestions])

  // Close the dropdown when clicking outside it.
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectOption = (option) => {
    onChange(option)
    onSelect?.(option)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!isOpen || options.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev + 1) % options.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev - 1 + options.length) % options.length)
        break
      case 'Enter':
        if (highlightedIndex >= 0) {
          e.preventDefault()
          selectOption(options[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      default:
        break
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => options.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className={
          inputClassName ||
          'w-full pl-11 pr-4 py-4 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 text-gray-900 text-sm transition-all'
        }
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto"
        >
          {options.map((option, index) => (
            <li
              key={option}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              onMouseDown={() => selectOption(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`flex items-center gap-2 px-4 py-3 text-sm cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MapPin size={14} className="text-gray-400 shrink-0" />
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}