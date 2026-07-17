import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Search, ChevronDown, User, LogOut, Home, Building, Tent, MapPin, Grid, PlusCircle, LayoutDashboard, Menu, X } from 'lucide-react'
import { openAuthModal } from '../../store/authSlice'
import { toggleMobileMenu, closeMobileMenu } from '../../store/uiSlice'
import { useAuth } from '../../hooks/useAuth'
import { useProperties } from '../../hooks/useProperties'
import { cn } from '../../utils/helpers'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '../ui/Skeleton'
import { CITIES } from '../../utils/constants'
import { BannerSlider } from './BannerSlider'
import { useDebounce } from '../../hooks/useDebounce'

export const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { user, profile, role, signOut, loading } = useAuth()
  const { filters, updateFilters, resetFilters } = useProperties()
  const { mobileMenuOpen } = useSelector(s => s.ui)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [cityMenuOpen, setCityMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState(filters.city || 'All Cities')
  const [searchQuery, setSearchQuery] = useState(filters.query || '')
  // Tracks if the user is actively typing in the Navbar's own search bar.
  // Without this guard, the debounce effect fires on any re-render where
  // searchQuery !== filters.query, causing rogue /search redirects (e.g. while
  // filling the service provider contact form).
  const userTypedInNavSearch = React.useRef(false)
  
  const debouncedSearchQuery = useDebounce(searchQuery, 400)
  
  // Debounce effect for search — only navigate if user actually typed here
  React.useEffect(() => {
    if (!userTypedInNavSearch.current) return
    if (debouncedSearchQuery !== (filters.query || '')) {
      updateFilters({ query: debouncedSearchQuery })
      if (!location.pathname.startsWith('/search') && debouncedSearchQuery.length > 0) {
        navigate('/search')
      }
    }
  }, [debouncedSearchQuery, updateFilters, navigate, location.pathname, filters.query])

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'hi', label: 'हिंदी', short: 'HI' }
  ]
  const currentLang = languages.find(l => l.code === (i18n.language?.split('-')[0] || 'en')) || languages[0]

  const changeLanguage = (code) => {
    i18n.changeLanguage(code)
    setLangMenuOpen(false)
  }


  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
    navigate('/')
  }

  const handleLiveSearch = (e) => {
    userTypedInNavSearch.current = true // user is actively typing in navbar
    setSearchQuery(e.target.value)
    if (mobileMenuOpen && e.target.value.length > 3) dispatch(closeMobileMenu())
  }

  const categoryTabs = [
    { name: t('property.types.Room'), value: 'Room', icon: <Home size={18} /> },
    { name: t('property.types.Flat'), value: 'Flat', icon: <Building size={18} /> },
    { name: t('property.types.Hostel'), value: 'Hostel', icon: <Tent size={18} /> },
    { name: t('property.types.PG'), value: 'PG', icon: <Building size={18} /> },
  ]

  return (
    <nav className="relative z-40 bg-white">
      {/* Top Navbar */}
      <div className="w-full px-2 sm:px-4">
        <div className="flex items-center justify-between h-20 relative">
          
          {/* Logo Section (Centered on mobile) */}
          <div className="absolute left-1/2 md:static -translate-x-1/2 md:translate-x-0 whitespace-nowrap z-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#CA3433] shadow-md flex items-center justify-center font-bold font-display rotate-3 group-hover:rotate-0 transition-all duration-300 overflow-hidden">
                <div className="-rotate-3 flex items-center justify-center translate-y-0.5">
                  <span className="text-[#CA3433] text-[22px] font-black leading-none">G</span>
                  <span className="text-[#CA3433] text-[15px] font-black leading-none -ml-0.5 mb-2">E</span>
                </div>
              </div>
              <span className="font-display font-black text-[22px] sm:text-2xl text-gray-900 tracking-tight leading-none pt-1">
                Go<span className="text-[#CA3433]">Eazy</span>
              </span>
            </Link>
          </div>
            
          {/* Language Picker (Left side) */}
          <div className="relative z-30">
            <button 
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:text-[#CA3433] transition-colors uppercase px-1 py-2"
            >
              {currentLang.short} <ChevronDown size={14} className={`transition-transform duration-200 ${langMenuOpen ? 'rotate-180 text-[#CA3433]' : ''}`} />
            </button>

            {langMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => changeLanguage(l.code)}
                      className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${currentLang.code === l.code ? 'bg-[#fff5f5] text-[#CA3433]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {l.label} ({l.short})
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="desktop-search"
                name="desktop-search"
                value={searchQuery}
                placeholder={t('hero.searchPlaceholder')}
                onChange={handleLiveSearch}
                className="w-full bg-gray-50 border border-transparent focus:border-[#CA3433] focus:ring-2 focus:ring-[#CA3433]/10 rounded-full py-2.5 pl-12 pr-4 text-sm font-medium focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Right Links & Auth */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center space-x-6 text-sm font-medium text-gray-500">
              <Link to="/search" className="px-3 py-1 bg-brand-lime text-gray-900 rounded-md font-semibold hover:bg-lime-400 transition-colors">{t('nav.home')}</Link>
              <Link to="/nearby" className="hover:text-gray-900 transition-colors py-2">{t('nav.nearby')}</Link>
              <button onClick={() => user ? navigate('/landlord') : dispatch(openAuthModal('login'))} className="hover:text-gray-900 transition-colors">{t('nav.list')}</button>
              <Link to="/about" className="hover:text-gray-900 transition-colors py-2">{t('nav.about')}</Link>
            </div>
            
            <div className="w-px h-6 bg-gray-200"></div>

            <button className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center text-xs overflow-hidden border border-brand-100">
                <img src="/INR.webp" alt="INR" className="w-full h-full object-cover" />
              </div>
              INR <ChevronDown size={14} />
            </button>

            {loading ? (
              <Skeleton className="h-10 w-28 rounded-full" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B0F19] text-white text-sm font-semibold hover:bg-[#CA3433] transition-all duration-300 transform hover:scale-105"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <User size={16} />
                  )}
                  <span>{role === 'admin' ? 'Admin Panel' : (profile?.full_name?.split(' ')[0] || 'Dashboard')}</span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                      <div className="py-1">
                        <button
                          onClick={() => { 
                            const dest = role === 'admin' ? '/systemadmin' : role === 'landlord' ? '/landlord' : role === 'service_provider' ? '/service-provider' : '/dashboard'
                            navigate(dest); setUserMenuOpen(false) 
                          }}
                          className="w-full flex flex-col items-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {role === 'admin' ? 'Admin Panel' : t('nav.dashboard')}
                        </button>
                        <button
                          onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                          className="w-full flex flex-col items-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                          {t('nav.settings')}
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                           {t('nav.signOut')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button 
                onClick={() => dispatch(openAuthModal('login'))}
                className="px-6 py-2.5 rounded-full bg-[#0B0F19] text-white text-sm font-semibold hover:bg-[#CA3433] transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
              >
                {t('nav.login')}
              </button>
            )}
          </div>
          
           {/* Mobile hamburger */}
           <button
            className="md:hidden p-2 rounded-xl text-gray-900"
            onClick={() => dispatch(toggleMobileMenu())}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Secondary Navbar (Categories) */}
      {!location.pathname.startsWith('/property/') && !location.pathname.startsWith('/services/') && !['/dashboard', '/settings', '/landlord', '/service-provider', '/privacy', '/terms', '/cookies', '/refund', '/about', '/nearby'].some(r => location.pathname.startsWith(r)) && (
        <>
          <BannerSlider />

          <div className="w-full border-t border-b border-gray-100 bg-white flex relative mt-2">
            {/* Scroll Indicator Gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none md:hidden" />
            
            <div className="flex items-center h-16 px-0 gap-6 overflow-x-auto scrollbar-hide flex-1 scroll-smooth">
              <button 
                onClick={() => {
                  resetFilters()
                  navigate('/search')
                }}
                className="flex items-center gap-2 px-6 h-full bg-gradient-to-r from-[#E63946] to-[#CA3433] text-white font-semibold rounded-tr-3xl"
              >
                <Grid size={18} /> {t('nav.allCategory')}
              </button>

              <div className="flex items-center gap-8 px-4 font-bold text-sm flex-1 whitespace-nowrap min-w-max">
                {categoryTabs.map(tab => (
                  <button 
                    key={tab.name}
                    onClick={() => {
                      updateFilters({ type: tab.value })
                      navigate(`/search?type=${tab.value}`)
                    }}
                    className={cn(
                      "flex items-center gap-2 h-16 border-b-[3px] transition-all px-2 group/tab",
                      filters.type === tab.value ? "border-[#CA3433] text-[#CA3433] bg-[#fff5f5]" : "border-transparent text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <span className="group-hover/tab:scale-110 transition-transform duration-200">
                      {tab.icon}
                    </span>
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center h-16 border-l border-gray-100 pl-6 pr-8 bg-white min-w-max relative cursor-pointer shrink-0" onClick={() => setCityMenuOpen(!cityMenuOpen)}>
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full border border-[#CA3433] overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                    <img src="/1.webp" alt="City" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col text-sm">
                    <span className="font-semibold text-gray-900 leading-tight">{selectedCity}</span>
                    <span className="text-gray-500 text-xs">Uttarakhand</span>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 ml-4 transition-transform duration-200 ${cityMenuOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* City Dropdown Menu */}
                {cityMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setCityMenuOpen(false); }} />
                    <div className="absolute right-4 top-full mt-3 w-48 bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-50 overflow-hidden py-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedCity('All Cities')
                          updateFilters({ city: '' })
                          setCityMenuOpen(false)
                        }}
                        className={`w-full text-left px-5 py-2.5 text-sm font-bold transition-colors ${selectedCity === 'All Cities' ? 'bg-[#fff5f5] text-[#CA3433]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        All Cities
                      </button>
                      {CITIES.map(city => (
                        <button
                          key={city}
                          onClick={() => {
                            setSelectedCity(city)
                            updateFilters({ city })
                            setCityMenuOpen(false)
                          }}
                          className={`w-full text-left px-5 py-2.5 text-sm font-semibold transition-colors ${selectedCity === city ? 'bg-[#fff5f5] text-[#CA3433]' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
          </div>
          
          {/* Mobile Search Bar (Out of menu, below banner/categories) */}
          <div className="md:hidden px-4 py-2 bg-white relative border-b border-gray-100 transition-all flex items-center gap-2 mt-1">
            
            {/* Mobile City Selection */}
            <div className="relative shrink-0">
              <button 
                onClick={() => setCityMenuOpen(!cityMenuOpen)}
                className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-full border border-[#CA3433]"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white shadow-sm">
                  <img src="/1.webp" alt="City" className="w-full h-full object-cover" />
                </div>
                <ChevronDown size={14} className={`text-gray-400 mr-1 transition-transform duration-200 ${cityMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {cityMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setCityMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 z-[70] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 border-b border-gray-50 mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('search.filters')}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCity('All Cities')
                        updateFilters({ city: '' })
                        setCityMenuOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${selectedCity === 'All Cities' ? 'bg-brand-50 text-brand-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      All Cities
                    </button>
                    {CITIES.map(city => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedCity(city)
                          updateFilters({ city })
                          setCityMenuOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${selectedCity === city ? 'bg-brand-50 text-brand-600' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="mobile-search-outside"
                name="mobile-search-outside"
                value={searchQuery}
                placeholder={t('hero.searchPlaceholder')}
                onChange={handleLiveSearch}
                className="w-full bg-gray-50 border border-[#CA3433] rounded-full py-2.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#CA3433]/20 shadow-sm transition-all"
              />
            </div>
          </div>
        </>
      )}
      
       {/* Mobile Menu */}
       {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-xl overflow-y-auto max-h-[80vh] z-50">
          <div className="px-4 py-4 space-y-4">
            
            <Link to="/search" onClick={() => dispatch(closeMobileMenu())} className="block font-semibold text-gray-700 py-2">{t('nav.home')}</Link>
            <Link to="/nearby" onClick={() => dispatch(closeMobileMenu())} className="block w-full text-left font-semibold text-gray-700 py-2">{t('nav.nearby')}</Link>
            <button onClick={() => { dispatch(closeMobileMenu()); user ? navigate(role === 'landlord' ? '/landlord' : role === 'service_provider' ? '/service-provider' : '/landlord') : dispatch(openAuthModal('login')) }} className="block w-full text-left font-semibold text-gray-700 py-2">{t('nav.list')}</button>
            <Link to="/about" onClick={() => dispatch(closeMobileMenu())} className="block w-full text-left font-semibold text-gray-700 py-2">{t('nav.about')}</Link>
            
            <div className="w-full h-px bg-gray-100 my-4" />
            
            {user ? (
               <>
                <Link to={role === 'admin' ? '/systemadmin' : role === 'landlord' ? '/landlord' : role === 'service_provider' ? '/service-provider' : '/dashboard'}
                  className="block font-semibold text-gray-700 py-2"
                  onClick={() => dispatch(closeMobileMenu())}
                >
                  {role === 'admin' ? 'Admin Panel' : t('nav.dashboard')}
                </Link>
                <Link to="/settings"
                  className="block font-semibold text-gray-700 py-2"
                  onClick={() => dispatch(closeMobileMenu())}
                >
                  {t('nav.settings')}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block font-semibold text-red-500 py-2"
                >
                  {t('nav.signOut')}
                </button>
               </>
            ) : (
              <button 
                onClick={() => { dispatch(openAuthModal('login')); dispatch(closeMobileMenu()); }}
                className="w-full py-3 rounded-full bg-[#0B0F19] text-white text-sm font-semibold hover:bg-[#CA3433] transition-all active:scale-95"
              >
                {t('nav.login')}
              </button>
            )}
          </div>
        </div>
       )}
    </nav>
  )
}
