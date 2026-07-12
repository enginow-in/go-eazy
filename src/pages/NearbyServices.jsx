import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, ChevronDown, Grid, List as ListIcon, RefreshCw, MapPin, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useServices } from '../hooks/useServices'
import { ServiceCard } from '../components/services/ServiceCard'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { resetServiceFilters } from '../store/serviceSlice'
import { useTranslation } from 'react-i18next'

const UK_CITIES = [
  'Dehradun', 'Srinagar', 'Rishikesh', 'Haldwani', 'Nainital', 'Haridwar', 'Roorkee', 'Rudrapur'
]

export const NearbyServices = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { services, filters, loading, hasMore, fetchServices, updateFilters } = useServices()

  const [viewMode, setViewMode] = useState('grid')
  const [searchInput, setSearchInput] = useState('')
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState({
    city: filters.city || '', 
    area: filters.area || '', 
    category: filters.category || '',
    sortBy: filters.sortBy || 'created_at', 
    sortOrder: filters.sortOrder || 'desc'
  })

  // Dynamic categories and sort options to support language switching
  const CATEGORIES = useMemo(() => [
    { value: '',         label: t('nearby.categories.all'), emoji: '✨' },
    { value: 'tiffin',  label: t('nearby.categories.tiffin'), emoji: '🍱' },
    { value: 'laundry', label: t('nearby.categories.laundry'), emoji: '🧺' },
    { value: 'cleaning',label: t('nearby.categories.cleaning'), emoji: '🧹' },
  ], [t])

  const serviceSortOptions = useMemo(() => [
    { value: 'created_at:desc', label: t('nearby.sort.newest') },
    { value: 'created_at:asc',  label: t('nearby.sort.oldest') },
    { value: 'views:desc',       label: t('nearby.sort.popular') },
  ], [t])

  // Read ?category= from URL and clear when the param is absent (mirrors Search.jsx ?type= pattern)
  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat && ['tiffin', 'laundry', 'cleaning'].includes(cat)) {
      if (filters.category !== cat) updateFilters({ category: cat })
    } else {
      if (filters.category) updateFilters({ category: '' })
    }
  }, [searchParams, updateFilters, filters.category])

  // Fetch whenever filters change
  useEffect(() => {
    fetchServices(true)
  }, [filters, fetchServices])

  useEffect(() => {
    // eslint-disable-next-line
    setLocalFilters({
      city: filters.city || '', 
      area: filters.area || '', 
      category: filters.category || '',
      sortBy: filters.sortBy || 'created_at', 
      sortOrder: filters.sortOrder || 'desc'
    })
  }, [filters])

  const applyFilters = () => {
    updateFilters(localFilters)
    setShowFilters(false)
  }

  const renderFilterContent = () => (
    <div className="space-y-6">
      {/* Location Selection */}
      <div>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('nearby.locationSel')}</h4>
        <div className="grid grid-cols-2 gap-3">
           <div className="flex flex-col gap-1.5">
             <div className="flex bg-gray-50 rounded-xl overflow-hidden border border-gray-200 focus-within:border-[#CA3433]/50 transition-colors pr-2">
               <input 
                 type="text" 
                 placeholder={t('nearby.cityPlaceholder')} 
                 className="w-full bg-transparent border-none text-sm py-2.5 px-3 focus:ring-0 outline-none" 
                 value={localFilters.city} 
                 onChange={e => setLocalFilters(prev => ({...prev, city: e.target.value}))} 
               />
             </div>
           </div>
           <div className="flex flex-col gap-1.5">
             <div className="flex bg-gray-50 rounded-xl overflow-hidden border border-gray-200 focus-within:border-[#CA3433]/50 transition-colors pr-2">
               <input 
                 type="text" 
                 placeholder={t('nearby.areaPlaceholder')} 
                 className="w-full bg-transparent border-none text-sm py-2.5 px-3 focus:ring-0 outline-none" 
                 value={localFilters.area} 
                 onChange={e => setLocalFilters(prev => ({...prev, area: e.target.value}))} 
               />
             </div>
           </div>
        </div>
      </div>

      {/* Sort By */}
      <div>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('nearby.sortBy')}</h4>
        <div className="grid grid-cols-3 gap-2">
          {serviceSortOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                const [by, ord] = opt.value.split(':');
                setLocalFilters(prev => ({ ...prev, sortBy: by, sortOrder: ord }));
              }}
              className={`px-2 py-2 rounded-xl text-[10px] font-bold transition-all border ${localFilters.sortBy + ':' + localFilters.sortOrder === opt.value ? 'bg-red-50 text-[#CA3433] border-[#CA3433]/30 shadow-sm' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Service Type */}
      <div>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('nearby.category')}</h4>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setLocalFilters(prev => ({ ...prev, category: cat.value }))}
              className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all border ${localFilters.category === cat.value ? 'bg-[#fdf2f2] text-[#CA3433] border-[#CA3433]/30 shadow-sm' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 flex gap-3 border-t border-gray-100">
        <Button variant="secondary" className="flex-1 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl font-bold py-2.5 text-xs" onClick={() => { dispatch(resetServiceFilters()); setShowFilters(false); }}>{t('nearby.reset')}</Button>
        <Button variant="primary" className="flex-1 rounded-xl shadow-lg shadow-[#CA3433]/10 font-bold py-2.5 text-xs" onClick={applyFilters}>{t('nearby.showResults')}</Button>
      </div>
    </div>
  )
  // eslint-disable-next-line
  const filterContent = useMemo(() => renderFilterContent(), [localFilters, showFilters, dispatch, t, CATEGORIES, serviceSortOptions])

  // Live search handler
  const handleSearch = (e) => {
    const val = e.target.value
    setSearchInput(val)
    updateFilters({ query: val })
  }

  return (
    <div className="pt-6 pb-16 min-h-screen bg-gray-50/50">
      <div className="w-full px-0 sm:px-0 md:px-0 lg:px-0">

        {/* ── Back Button ──────────────────────────────────── */}
        <div className="px-2 sm:px-4 mb-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} /> {t('nearby.backHome')}
          </button>
        </div>

        {/* ── Page Header (Centered) ──────────────────────────────────── */}
        <div className="mb-4 px-2 sm:px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter font-display uppercase">
            {t('nearby.header')} <span className="text-[#CA3433]">{t('nearby.services')}</span>
          </h1>
        </div>

        {/* ── Search Bar + State Filter Row ────────────────── */}
        {/* ── Search + Filter Section (Synced with Search Page padding) ────────────────────── */}
        <div className="mb-4 px-2 sm:px-4 flex flex-col gap-4">
          <div className="flex flex-row gap-3 items-center w-full">
            {/* City selector (Compact on mobile, height-matched with search bar) */}
            <div className="relative shrink-0 flex items-center">
              <button
                onClick={() => setShowCityDropdown(v => !v)}
                className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-white border border-[#CA3433] sm:border-gray-200 rounded-full sm:rounded-2xl transition-all shadow-sm group h-[46px] ${showCityDropdown ? 'border-[#CA3433] ring-4 ring-[#CA3433]/5' : 'hover:border-[#CA3433]'}`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#CA3433] overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <img src="/1.webp" alt="Map" className="w-full h-full object-cover" />
                </div>
                <div className="hidden sm:flex flex-col items-start pr-1 -space-y-0.5">
                  <span className="text-sm font-bold text-gray-950 leading-tight">{t(`cities.${filters.city}`) || t('nearby.allCities')}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">{t('nav.state')}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${showCityDropdown ? 'rotate-180 text-[#CA3433]' : ''}`} />
              </button>
              
              {showCityDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowCityDropdown(false)} />
                  <div className="absolute left-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-50 max-h-[400px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('nearby.selectCity')}</h4>
                    </div>
                    <div className="overflow-y-auto scrollbar-hide py-1">
                      <button
                        onClick={() => { updateFilters({ city: '' }); setShowCityDropdown(false) }}
                        className={`w-full px-5 py-3 text-left text-sm font-bold transition-colors ${!filters.city ? 'text-[#CA3433] bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {t('nearby.allCities')}
                      </button>
                      {UK_CITIES.map(c => (
                        <button
                          key={c}
                          onClick={() => { updateFilters({ city: c }); setShowCityDropdown(false) }}
                          className={`w-full px-5 py-2.5 text-left text-sm font-semibold transition-colors ${filters.city === c ? 'font-bold text-[#CA3433] bg-red-50' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          {t(`cities.${c}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="service-search"
                type="text"
                placeholder={t('nearby.searchPlaceholder')}
                value={searchInput}
                onChange={handleSearch}
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#CA3433] sm:border-gray-200 rounded-full sm:rounded-2xl text-sm focus:outline-none focus:border-[#CA3433] focus:ring-4 focus:ring-[#CA3433]/5 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full">
            {/* Area input (Full width to match row above) */}
            <div className="relative flex-1">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('nearby.areaSearchPlaceholder')}
                value={filters.area || ''}
                onChange={e => updateFilters({ area: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#CA3433] sm:border-gray-200 rounded-full sm:rounded-2xl text-sm focus:outline-none focus:border-[#CA3433] focus:ring-4 focus:ring-[#CA3433]/5 transition-all shadow-sm"
              />
            </div>

            {/* Advanced Filters Toggle */}
            <div className="relative">
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`flex items-center gap-2 px-6 py-3 bg-white border rounded-full sm:rounded-2xl text-sm font-bold transition-all ${showFilters ? 'border-[#CA3433] text-[#CA3433] shadow-md ring-4 ring-red-50' : 'border-[#CA3433] sm:border-gray-200 text-gray-700 hover:shadow-sm'}`}
              >
                <Filter size={16} />
                <span className="hidden sm:inline">{t('nearby.filters')}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showFilters ? 'rotate-180 text-[#CA3433]' : 'text-gray-400'}`} />
              </button>
              
              {showFilters && (
                <>
                  <div className="fixed inset-0 z-[40] bg-black/5 backdrop-blur-[1px]" onClick={() => setShowFilters(false)}></div>
                  <div className="absolute right-0 top-full mt-3 w-[calc(100vw-2rem)] sm:w-[460px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 p-6 z-[50] cursor-default overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {filterContent}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Category Tabs (Full width 0-margin) */}
        <div className="w-full border-t border-b border-gray-100 bg-white flex relative mb-4">
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none md:hidden" />
          
          <div className="flex items-center h-16 md:h-16 px-0 gap-4 md:gap-6 overflow-x-auto scrollbar-hide flex-1 scroll-smooth bg-white">
            <button 
              onClick={() => updateFilters({ category: '' })}
              className={`flex items-center gap-2 px-6 h-full font-semibold transition-all shrink-0 ${filters.category === '' ? 'bg-gradient-to-r from-[#E63946] to-[#CA3433] text-white rounded-tr-3xl shadow-[4px_0_15px_rgb(202,52,51,0.2)]' : 'bg-transparent text-gray-600 hover:text-gray-900 border-r border-gray-100'}`}
            >
              <Grid size={18} /> {t('nearby.categories.all')}
            </button>

            <div className="flex items-center gap-8 px-4 font-bold text-sm flex-1 whitespace-nowrap min-w-max">
              {CATEGORIES.slice(1).map(cat => (
                <button 
                  key={cat.value}
                  onClick={() => updateFilters({ category: cat.value })}
                  className={`flex items-center gap-2 h-16 border-b-[3px] transition-all px-2 group/tab ${filters.category === cat.value ? "border-[#CA3433] text-[#CA3433] bg-[#fff5f5]" : "border-transparent text-gray-500 hover:text-gray-900"}`}
                >
                  <span className="group-hover/tab:scale-110 transition-transform duration-200">
                    {cat.emoji}
                  </span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* View toggles (desktop) */}
          <div className="hidden md:flex items-center gap-2 ml-auto h-16 bg-white px-4 border-l border-gray-100">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg border transition-all ${viewMode === 'grid' ? 'border-[#CA3433] text-[#CA3433] bg-[#fff5f5]' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>
              <Grid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg border transition-all ${viewMode === 'list' ? 'border-[#CA3433] text-[#CA3433] bg-[#fff5f5]' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>
              <ListIcon size={18} />
            </button>
          </div>
        </div>

        {/* ── Results Count & Layout Switch (Synced with Search Page padding) ─────────────────────────────────── */}
        <div className="px-2 sm:px-4 mb-4 flex items-center justify-between gap-4">
          <p className="text-[10px] sm:text-sm text-gray-400 font-bold uppercase tracking-widest leading-none">
            {loading ? t('nearby.searching') : t('nearby.providersFound', { count: services.length })}
          </p>

          {/* Mobile view switchers */}
          <div className="md:hidden flex items-center gap-1.5 p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-red-50 text-[#CA3433]' : 'text-gray-400'}`}
              aria-label="Grid View"
            >
              <Grid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-red-50 text-[#CA3433]' : 'text-gray-400'}`}
              aria-label="List View"
            >
              <ListIcon size={16} />
            </button>
          </div>
        </div>

        {/* ── Results Grid (Synced with Search Page padding) ─────────────────────────────────── */}
        <div className="px-2 sm:px-4">
          {loading && services.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <Skeleton className="h-1.5 w-full" />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : services.length > 0 ? (
          <>
            <div className={`grid gap-3 sm:gap-5 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' : 'grid-cols-1'}`}>
              {services.map(s => (
                <ServiceCard key={s.id} service={s} layout={viewMode} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-12 text-center pb-10">
                <Button variant="secondary" onClick={() => fetchServices(false)} loading={loading} className="px-10 rounded-2xl border-gray-200">
                  {t('nearby.loadMore')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-3xl p-16 md:p-24 text-center border border-dashed border-gray-200 shadow-sm mx-4 sm:mx-10 md:mx-16 lg:mx-20">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Search className="text-gray-300" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('nearby.noFound')}</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-8">{t('nearby.noFoundDesc')}</p>
            <Button variant="secondary" onClick={() => { dispatch(resetServiceFilters()); setSearchInput('') }} className="rounded-xl border-gray-200">
              {t('nearby.reset')}
            </Button>
          </div>
        )}
      </div>
     </div>
    </div>
  )
}
