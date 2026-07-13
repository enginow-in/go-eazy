import React, { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../utils/helpers'
import { motion, AnimatePresence } from 'framer-motion'

export const Autocomplete = ({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Search...',
  className = '',
  inputClassName = '',
  icon = <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />,
  id = 'autocomplete-search',
  name = 'search'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!value) {
      setFiltered(suggestions)
    } else {
      setFiltered(suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())))
    }
  }, [value, suggestions])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative w-full", className)} ref={wrapperRef}>
      {icon}
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 text-gray-900 transition-all",
          inputClassName
        )}
      />
      <AnimatePresence>
        {isOpen && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {filtered.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(suggestion)
                  setIsOpen(false)
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-gray-50 last:border-0"
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
