import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Heart, Search, SlidersHorizontal, ArrowUpDown, X, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProperties } from '../hooks/useProperties'
import { PropertyCard } from '../components/property/PropertyCard'
import { supabase } from '../lib/supabase'
import { MOCK_PROPERTIES, CITIES, PROPERTY_TYPES } from '../utils/constants'
import { Skeleton } from '../components/ui/Skeleton'

const SkeletonLoader = () => (
  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-[320px]">
        <Skeleton className="w-full h-[180px]" />
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <div className="flex justify-between items-end">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const SavedProperties = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { favorites } = useProperties()
  const [favProps, setFavProps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Search & Filter State
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [priceMax, setPriceMax] = useState(100000)
  const [selectedType, setSelectedType] = useState('')
  const [selectedGender, setSelectedGender] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination
  const [visibleCount, setVisibleCount] = useState(8)

  const loadProperties = async () => {
    if (!favorites || favorites.length === 0) {
      setFavProps([])
      setLoading(false)
      return
    }
    
    // Only set loading if we don't have any data yet
    if (favProps.length === 0) {
      setLoading(true)
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .in('id', favorites)
      
      if (fetchError) throw fetchError
      if (data) {
        // preserve order based on favorites array
        const ordered = favorites.map(id => data.find(p => p.id === id)).filter(Boolean)
        setFavProps(ordered)
        setError(null)
      }
    } catch (err) {
      console.error('Error loading saved properties:', err)
      setError('Failed to fetch saved properties from server. Falling back to local/mock data.')
      // Fallback: match favorite IDs from MOCK_PROPERTIES
      const fallbackData = MOCK_PROPERTIES.filter(p => favorites.includes(p.id))
      setFavProps(fallbackData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProperties()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites]) // Re-run when favorites list changes

  // Filter and Sort Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...favProps]

    // 1. Search filter (title, description, area)
    if (search.trim()) {
      const query = search.toLowerCase()
      result = result.filter(p => 
        p.title?.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query) ||
        p.area?.toLowerCase().includes(query)
      )
    }

    // 2. City Filter
    if (selectedCity) {
      result = result.filter(p => p.city?.toLowerCase() === selectedCity.toLowerCase())
    }

    // 3. Price Filter
    result = result.filter(p => Number(p.price) <= priceMax)

    // 4. Room/Property Type Filter
    if (selectedType) {
      result = result.filter(p => p.type?.toLowerCase() === selectedType.toLowerCase())
    }

    // 5. Gender Filter (Checking title/description for keywords since no DB field exists)
    if (selectedGender) {
      const gender = selectedGender.toLowerCase()
      result = result.filter(p => {
        const text = `${p.title} ${p.description}`.toLowerCase()
        if (gender === 'boys') return text.includes('boys') || text.includes('boy') || text.includes('men') || text.includes('male')
        if (gender === 'girls') return text.includes('girls') || text.includes('girl') || text.includes('women') || text.includes('female')
        if (gender === 'coed') return text.includes('coed') || text.includes('co-ed') || text.includes('unisex') || text.includes('sharing')
        return true
      })
    }

    // 6. Availability Filter
    if (onlyAvailable) {
      result = result.filter(p => p.availability === true)
    }

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
    } else if (sortBy === 'alpha') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    } else if (sortBy === 'rentAsc') {
      result.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortBy === 'rentDesc') {
      result.sort((a, b) => Number(b.price) - Number(a.price))
    }

    return result
  }, [favProps, search, selectedCity, priceMax, selectedType, selectedGender, onlyAvailable, sortBy])

  const handleResetFilters = () => {
    setSearch('')
    setSelectedCity('')
    setPriceMax(100000)
    setSelectedType('')
    setSelectedGender('')
    setOnlyAvailable(true)
    setSortBy('newest')
  }

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8)
  }

  const SkeletonLoader = () => (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-[320px]">
          <Skeleton className="w-full h-[180px]" />
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="flex justify-between items-end">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="pt-28 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/search')}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              aria-label="Back to search"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-900 font-display flex items-center gap-2 tracking-tight">
                Saved Properties
                <Heart size={28} className="text-[#CA3433] fill-[#CA3433] animate-pulse" />
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-0.5">
                {favorites.length} listings saved to your collection {!user && '(Guest Session)'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
            <AlertCircle size={20} className="shrink-0 text-amber-600" />
            <div className="flex-1 text-sm font-medium">{error}</div>
            <button 
              onClick={loadProperties} 
              className="px-4 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Controls Panel */}
        {favorites.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8 space-y-4">
            {/* Search & Sort & Toggle Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, description, or area..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent focus:border-[#CA3433] focus:ring-2 focus:ring-[#CA3433]/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex items-center gap-2 bg-gray-50 border border-transparent focus-within:border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700">
                  <ArrowUpDown size={16} className="text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent focus:outline-none cursor-pointer pr-4 font-bold text-gray-800"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="alpha">Alphabetical</option>
                    <option value="rentAsc">Rent: Low to High</option>
                    <option value="rentDesc">Rent: High to Low</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#CA3433]/15 ${
                    showFilters 
                      ? 'bg-[#CA3433]/5 border-[#CA3433] text-[#CA3433]' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </button>
              </div>
            </div>

            {/* Advanced Filters Expandable Panel */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
                {/* City Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent focus:border-[#CA3433] focus:ring-2 focus:ring-[#CA3433]/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none"
                  >
                    <option value="">All Cities</option>
                    {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                {/* Room/Property Type Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Room Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent focus:border-[#CA3433] focus:ring-2 focus:ring-[#CA3433]/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none"
                  >
                    <option value="">All Types</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Gender Filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gender Preference</label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent focus:border-[#CA3433] focus:ring-2 focus:ring-[#CA3433]/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none"
                  >
                    <option value="">No Preference</option>
                    <option value="boys">Boys / Men</option>
                    <option value="girls">Girls / Women</option>
                    <option value="coed">Co-ed / Sharing</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Max Price</label>
                    <span className="text-xs font-extrabold text-[#CA3433]">₹{priceMax.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="100000"
                    step="1000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="h-2 w-full bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#CA3433]"
                  />
                </div>

                {/* Availability Toggle */}
                <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between bg-gray-50 p-3 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">Only Available Listings</span>
                    <span className="text-xs text-gray-500 font-medium">Hide properties that are currently rented or filled</span>
                  </div>
                  <button
                    onClick={() => setOnlyAvailable(!onlyAvailable)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#CA3433]/10 ${
                      onlyAvailable ? 'bg-[#CA3433]' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                      onlyAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <SkeletonLoader />
        ) : favorites.length === 0 ? (
          /* Empty Saved Properties List */
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto mt-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={32} className="text-[#CA3433] fill-[#CA3433]/10 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No saved properties yet</h2>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">
              Start exploring listings and save your favorites to view them here later.
            </p>
            <button 
              onClick={() => navigate('/search')}
              className="bg-[#CA3433] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#CA3433]/90 transition-colors shadow-lg shadow-[#CA3433]/20"
            >
              Explore Properties
            </button>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          /* Filters Active, but no matches */
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto mt-6">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <SlidersHorizontal size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No matches found</h2>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">
              We couldn't find any properties matching your selected filters. Try resetting them.
            </p>
            <button 
              onClick={handleResetFilters}
              className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Render filtered grid */
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAndSorted.slice(0, visibleCount).map(p => (
                <PropertyCard key={p.id} property={p} layout="grid" condensed={true} />
              ))}
            </div>
            
            {/* Load More Pagination */}
            {filteredAndSorted.length > visibleCount && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#CA3433]/15"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
