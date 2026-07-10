import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Filter, Grid, List as ListIcon, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProperties } from '../hooks/useProperties'
import { PropertyCard } from '../components/property/PropertyCard'
import { Button } from '../components/ui/Button'
import { resetFilters } from '../store/propertySlice'
import { AMENITIES, SORT_OPTIONS } from '../utils/constants'
import { AMENITY_ICONS, cn } from '../utils/helpers'
import { RecommendedSection } from '../components/property/RecommendedSection'

export const Search = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const { filters, updateFilters } = useProperties()
  
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)

  // 1. HARDCODED MOCK DATA FOR THE HACKATHON DEMO PRESENTATION
  const mockListings = useMemo(() => [
    {
      id: '1',
      title: 'Premium Student PG near UPES Campus',
      type: 'PG',
      city: 'Dehradun',
      area: 'Bidholi',
      price: 6500,
      amenities: ['Wifi', 'Geyser', 'Power Backup'],
      images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80']
    },
    {
      id: '2',
      title: 'Single Room for Boys near HNBGU',
      type: 'Room',
      city: 'Srinagar',
      area: 'Chauras Campus',
      price: 3500,
      amenities: ['Wifi', 'Water Purifier'],
      images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=500&q=80']
    },
    {
      id: '3',
      title: '2 BHK Luxury Flat for Professionals',
      type: 'Flat',
      city: 'Dehradun',
      area: 'Rajpur Road',
      price: 18000,
      amenities: ['Wifi', 'Geyser', 'Power Backup', 'AC'],
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=500&q=80']
    },
    {
      id: '4',
      title: 'Cozy Girls Hostel Accommodation',
      type: 'Hostel',
      city: 'Dehradun',
      area: 'Karanpur',
      price: 8500,
      amenities: ['Wifi', 'Geyser', 'CCTV', 'Power Backup'],
      images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=500&q=80']
    }
  ], []);

  // Initialize local filter states
  const [localFilters, setLocalFilters] = useState({
    city: filters.city || '', 
    area: filters.area || '', 
    priceMin: filters.priceMin || 0, 
    priceMax: filters.priceMax || 100000, 
    amenities: [...(filters.amenities || [])], 
    sortBy: filters.sortBy || 'created_at', 
    sortOrder: filters.sortOrder || 'desc',
    type: filters.type || ''
  })

  // Read URL query strings (?type=) safely
  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam && ['Room', 'Flat', 'Hostel', 'PG'].includes(typeParam)) {
      setLocalFilters(prev => ({ ...prev, type: typeParam }))
    } else {
      setLocalFilters(prev => ({ ...prev, type: '' }))
    }
  }, [searchParams])

  // Sync state cleanly if global hooks change execution parameters
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      city: filters.city || '', 
      area: filters.area || '', 
      amenities: [...(filters.amenities || [])],
      type: filters.type || ''
    }))
  }, [filters])

  // 2. CLIENT-SIDE COMPUTATIONAL FILTER ENGINE (Bypasses Broken Database Pipelines)
  const listings = useMemo(() => {
    return mockListings.filter(item => {
      if (localFilters.city && !item.city.toLowerCase().includes(localFilters.city.toLowerCase())) return false;
      if (localFilters.area && !item.area.toLowerCase().includes(localFilters.area.toLowerCase())) return false;
      if (item.price > localFilters.priceMax) return false;
      if (localFilters.type && item.type !== localFilters.type) return false;
      
      if (localFilters.amenities.length > 0) {
        const hasAllSelected = localFilters.amenities.every(a => item.amenities.includes(a));
        if (!hasAllSelected) return false;
      }
      return true;
    });
  }, [localFilters, mockListings]);

  // Handle local state assignments smoothly
  const loading = false;
  const hasMore = false;
  const count = listings.length;

  const applyFilters = () => {
    updateFilters(localFilters)
    setShowFilters(false)
  }

  const handleResetAll = () => {
    setLocalFilters({
      city: '', 
      area: '', 
      priceMin: 0, 
      priceMax: 100000, 
      amenities: [], 
      sortBy: 'created_at', 
      sortOrder: 'desc',
      type: ''
    })
    dispatch(resetFilters())
    setShowFilters(false)
  }

  const renderFilterContent = () => (
    <div className="space-y-6">
      {/* Location Selection */}
      <div>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Location Selection</h4>
        <div className="grid grid-cols-2 gap-3">
           <div className="flex flex-col gap-1.5 focus-within:text-brand-600 transition-colors">
             <label htmlFor="filter-city" className="sr-only">City</label>
             <div className="flex bg-gray-50 rounded-xl overflow-hidden border border-gray-200 focus-within:border-brand-50-focus transition-colors pr-2">
               <input 
                 type="text" 
                 id="filter-city"
                 name="city"
                 placeholder="City (e.g. Dehradun)" 
                 className="w-full bg-transparent border-none text-sm py-2.5 px-3 focus:ring-0 outline-none" 
                 value={localFilters.city} 
                 onChange={e => setLocalFilters(prev => ({...prev, city: e.target.value}))} 
               />
             </div>
           </div>
           <div className="flex flex-col gap-1.5 focus-within:text-brand-600 transition-colors">
             <label htmlFor="filter-area" className="sr-only">Area</label>
             <div className="flex bg-gray-50 rounded-xl overflow-hidden border border-gray-200 focus-within:border-brand-50-focus transition-colors pr-2">
               <input 
                 type="text" 
                 id="filter-area"
                 name="area"
                 placeholder="Area" 
                 className="w-full bg-transparent border-none text-sm py-2.5 px-3 focus:ring-0 outline-none" 
                 value={localFilters.area} 
                 onChange={e => setLocalFilters(prev => ({...prev, area: e.target.value}))} 
               />
             </div>
           </div>
        </div>
      </div>

      {/* Sort & Price Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Sort By</h4>
          <div className="grid grid-cols-2 gap-2">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const [by, ord] = opt.value.split(':');
                  setLocalFilters(prev => ({ ...prev, sortBy: by, sortOrder: ord }));
                }}
                className={`px-3 py-2 rounded-xl text-[11px] font-semibold transition-all border ${localFilters.sortBy + ':' + localFilters.sortOrder === opt.value ? 'bg-brand-50 text-brand-600 border-brand-200 shadow-sm' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
           <div className="flex justify-between items-center mb-2">
             <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Price Max</h4>
             <span className="text-sm font-bold text-brand-600">₹{localFilters.priceMax >= 100000 ? '1L+' : localFilters.priceMax.toLocaleString()}</span>
           </div>
           <div className="pt-4 pb-2">
             <input 
               type="range" 
               min="0" 
               max="100000" 
               step="1000"
               value={localFilters.priceMax} 
               onChange={e => setLocalFilters(prev => ({...prev, priceMax: Number(e.target.value)}))}
               className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#CA3433]"
             />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                <span>₹0</span>
                <span>₹1L</span>
              </div>
           </div>
        </div>
      </div>

      {/* Property Type Selector */}
      <div>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Property Type</h4>
        <div className="flex flex-wrap gap-2">
          {['Room', 'Flat', 'Hostel', 'PG'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setLocalFilters(prev => ({ ...prev, type: prev.type === type ? '' : type }))}
              className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all border ${localFilters.type === type ? 'bg-[#fdf2f2] text-[#CA3433] border-[#fbe1e1] shadow-sm' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}
            >
              {t(`property.types.${type}`, type)}
            </button>
          ))}
        </div>
      </div>

      {/* 3. INTERACTIVE VISUAL SUITE: UPGRADED AMENITIES LAYOUT CONTAINER */}
      <div>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Student Essentials (Amenities)</h4>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES?.map(amenity => {
            const IconComponent = AMENITY_ICONS[amenity] || Filter;
            const isSelected = localFilters.amenities.includes(amenity);
            
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => {
                  setLocalFilters(prev => {
                    const exists = prev.amenities.includes(amenity);
                    const updated = exists
                      ? prev.amenities.filter(a => a !== amenity)
                      : [...prev.amenities, amenity];
                    return { ...prev, amenities: updated };
                  });
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all border text-left ${
                  isSelected 
                    ? 'bg-brand-50 text-brand-600 border-brand-200 shadow-sm font-semibold' 
                    : 'border-gray-100 text-gray-600 hover:bg-gray-50 bg-white'
                }`}
              >
                <IconComponent size={15} className={isSelected ? 'text-brand-500' : 'text-gray-400'} />
                <span className="truncate">{t(`property.amenities.${amenity}`, amenity)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 flex gap-3 border-t border-gray-100">
        <Button variant="secondary" type="button" className="flex-1 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl font-bold py-2.5" onClick={handleResetAll}>Reset All</Button>
        <Button variant="primary" type="button" className="flex-1 rounded-xl shadow-lg shadow-brand-500/10 font-bold py-2.5" onClick={applyFilters}>Show Results</Button>
      </div>
    </div>
  )

  // Memoize Filter UI for premium render latency optimization
  const filterContent = useMemo(() => renderFilterContent(), [localFilters, t])

  return (
    <div className="pt-4 pb-12 min-h-screen bg-gray-50/50">
      <div className="w-full px-2 sm:px-4">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between gap-4 w-full">
              <div>
                <h1 className="text-[14px] sm:text-2xl md:text-3xl font-light text-gray-800 flex items-center gap-2 italic font-display tracking-tight pr-2">
                  <span className="text-brand-500 font-normal opacity-50">—</span> 
                  <span>{t('search.quoteStart', 'Find your perfect')} <strong className="font-extrabold text-gray-900">{t('search.quoteEnd', 'Student Home')}</strong>"</span>
                </h1>
                <p className="text-[10px] sm:text-base text-gray-500 mt-1 sm:mt-2 pl-4 sm:pl-8 font-medium">
                  {count} {localFilters.type ? localFilters.type : 'Properties'} Verified Available Near You
                </p>
              </div>

              {/* Mobile Actions (View Toggles + Filter Dashboard) */}
              <div className="md:hidden flex items-center gap-3 relative z-30">
                <div className="flex items-center gap-2 pr-2 border-r border-gray-200 mr-1">
                  <button 
                    onClick={() => setViewMode('grid')} 
                    className={`p-2 transition-all rounded-lg ${viewMode === 'grid' ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-100' : 'text-gray-400'}`}
                  >
                    <Grid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')} 
                    className={`p-2 transition-all rounded-lg ${viewMode === 'list' ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-100' : 'text-gray-400'}`}
                  >
                    <ListIcon size={18} className="rotate-90" />
                  </button>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setShowFilters(!showFilters)} 
                    className={`flex items-center justify-center p-2.5 bg-white border rounded-xl transition-all shadow-sm ${showFilters ? 'border-brand-500 text-brand-600 ring-2 ring-brand-50' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                    aria-label="Toggle Filters"
                  >
                    <Filter size={20} />
                  </button>
                  
                  {showFilters && (
                    <>
                      <div className="fixed inset-0 bg-black/5 backdrop-blur-[1px] z-10" onClick={() => setShowFilters(false)}></div>
                      <div className="absolute right-0 top-full mt-3 w-[calc(100vw-2rem)] xs:w-[340px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-5 z-20 cursor-default animate-in fade-in zoom-in-95 duration-200">
                        {filterContent}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
             {/* View Toggles */}
             <div className="flex items-center gap-3 text-gray-400 mr-2">
               <button onClick={() => setViewMode('grid')} className={`hover:text-gray-900 transition-colors ${viewMode === 'grid' ? 'text-gray-900 border border-gray-200 rounded p-1 shadow-sm' : 'p-1'}`}>
                 <Grid size={20} />
               </button>
               <button onClick={() => setViewMode('list')} className={`hover:text-gray-900 transition-colors ${viewMode === 'list' ? 'text-gray-900 border border-gray-200 rounded p-1 shadow-sm' : 'p-1'}`}>
                  <ListIcon size={22} className="rotate-90" />
               </button>
             </div>
             
             {/* Desktop Filters Button & Control Grid Panel */}
             <div className="relative z-20">
               <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-6 py-2.5 bg-white border rounded-xl text-sm font-semibold transition-all ml-4 ${showFilters ? 'border-brand-500 text-brand-600 shadow-sm' : 'border-gray-200 text-gray-700 hover:shadow-sm'}`}>
                  <Filter size={16} />
                  <span>Filters</span>
                  <ChevronDown size={14} className={`ml-2 transition-transform duration-300 ${showFilters ? 'rotate-180 text-brand-500' : 'text-gray-400'}`} />
               </button>
               
               {showFilters && (
                 <>
                   <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)}></div>
                   <div className="absolute right-0 top-full mt-3 w-[460px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 p-6 z-20 cursor-default overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     {filterContent}
                   </div>
                 </>
               )}
             </div>
          </div>
        </div>

        {/* Recommendation Component Suite Integration */}
        <RecommendedSection viewMode={viewMode} />

        {/* Results Render Block Matrix */}
        {listings.length > 0 ? (
          <div className={cn(
             "grid gap-3 sm:gap-6 xl:gap-8",
             viewMode === 'grid' ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid-cols-1"
          )}>
            {listings.map(p => <PropertyCard key={p.id} property={p} layout={viewMode} />)}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No student homes found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              We couldn't find any properties matching your selected essentials. Try resetting or expanding your query constraints.
            </p>
            <Button variant="secondary" onClick={handleResetAll}>
              Clear all active filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}