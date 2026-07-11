import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Sparkles, Compass, MapPin, Heart, Share2, Download, Map, 
  Grid, Check, ArrowLeftRight, LineChart, Train, GraduationCap, 
  Building2, X, Percent, ArrowRight, Search, TrendingUp, DollarSign,
  Award, Coins
} from 'lucide-react'
import { useProperties } from '../hooks/useProperties'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { MOCK_PROPERTIES } from '../utils/constants'

const AiPropertyCard = React.memo(({ property, comparedIds, toggleCompare, handleSave, handleShare, findSimilar }) => {
  const isCompared = comparedIds.includes(property.id)
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden group shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col h-full relative"
      tabIndex={0}
      aria-label={`Property card for ${property.title}`}
    >
      {/* Image Wrapper */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <img 
          src={property.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'} 
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
          alt={property.title}
        />
        
        {/* Score Ring badge */}
        <div className="absolute top-3 left-3 bg-slate-900/90 text-white rounded-full px-2.5 py-1 flex items-center gap-1.5 border border-white/10 shadow-md">
          <Sparkles size={11} className="text-yellow-400" />
          <span className="text-[11px] font-extrabold text-white">{property.score}% Match</span>
        </div>

        {/* Badge */}
        <div className="absolute top-3 right-3 bg-red-600 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-sm border border-red-500">
          {property.badge}
        </div>
      </div>

      {/* Content Block */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold text-[#CA3433] uppercase tracking-wider block mb-1">
            {property.type} • {property.city}
          </span>
          <h3 className="text-base font-bold text-gray-900 group-hover:text-[#CA3433] transition-colors line-clamp-1">
            {property.title}
          </h3>

          {/* Price Row */}
          <div className="flex items-baseline justify-between mt-2 mb-3">
            <span className="text-lg font-black text-gray-900">₹{Number(property.price).toLocaleString('en-IN')}<span className="text-xs font-normal text-gray-500">/mo</span></span>
            <span className="text-[11px] font-medium text-gray-400">Est. EMI: ₹{property.emi.toLocaleString('en-IN')}</span>
          </div>

          {/* Facility Tags (Rooms/Area) */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-gray-100 rounded-xl p-2.5 text-xs text-gray-600 mb-3 text-center">
            <div>
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Beds</span>
              <span className="font-bold">{property.bedrooms} BHK</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Baths</span>
              <span className="font-bold">{property.bathrooms} Baths</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Area</span>
              <span className="font-bold">{property.area || 1100} sqft</span>
            </div>
          </div>
          
          {/* Investment Metrics */}
          <div className="grid grid-cols-2 gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-xs text-emerald-800 mb-3 text-center">
             <div>
               <span className="block text-[10px] text-emerald-600/80 uppercase font-semibold">Growth</span>
               <span className="font-bold">+{property.investment.growth}%</span>
             </div>
             <div>
               <span className="block text-[10px] text-emerald-600/80 uppercase font-semibold">Rental Yield</span>
               <span className="font-bold">{property.investment.yield}%</span>
             </div>
          </div>

          {/* AI Explanation / Matching reason */}
          <div className="bg-red-50/40 border border-red-100/50 rounded-xl p-3 text-xs text-gray-600 leading-normal mb-4">
            <span className="block text-[9px] text-[#CA3433] font-bold uppercase tracking-widest mb-1">Recommendation Basis</span>
            <p className="font-medium text-slate-700">{property.aiExplanation}</p>
          </div>
        </div>

        <div>
          {/* Proximity / Distances */}
          <div className="grid grid-cols-2 gap-1 border-t border-gray-100 pt-3 text-[11px] text-gray-500 mb-4">
            <span className="flex items-center gap-1"><Train size={11} className="text-blue-500" /> Metro: {property.distances.metro}km</span>
            <span className="flex items-center gap-1"><GraduationCap size={11} className="text-amber-500" /> School: {property.distances.school}km</span>
          </div>
          
          {/* Main Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
             <button
               type="button"
               onClick={() => navigate(`/property/${property.id}`)}
               className="py-2 text-xs font-bold rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
               aria-label={`View details for ${property.title}`}
             >
               View Details
             </button>
             <button
               type="button"
               onClick={() => findSimilar(property)}
               className="py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
               aria-label="Find similar properties"
             >
               Find Similar
             </button>
          </div>

          {/* Utility Card Actions */}
          <div className="pt-3 border-t border-gray-100 flex gap-2">
            <button
              type="button"
              onClick={() => toggleCompare(property.id)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${isCompared ? 'bg-slate-800 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-700 hover:bg-slate-100'}`}
              aria-label={isCompared ? "Remove from comparison" : "Add to comparison"}
            >
              <ArrowLeftRight size={12} />
              <span>{isCompared ? 'Selected' : 'Compare'}</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleSave(property.id)}
              className="p-2 rounded-lg bg-slate-50 border border-gray-200 hover:bg-red-50 text-[#CA3433] transition-colors"
              aria-label="Save Property"
            >
              <Heart size={14} className={property.isFavorite ? "fill-[#CA3433]" : ""} />
            </button>

            <button
              type="button"
              onClick={() => handleShare(property)}
              className="p-2 rounded-lg bg-slate-50 border border-gray-200 hover:bg-slate-100 text-gray-500 transition-colors"
              aria-label="Share Link"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
AiPropertyCard.displayName = 'AiPropertyCard'

export const AiPropertyFinder = () => {
  const routerLocation = useLocation()
  const navigate = useNavigate()
  const { listings, favorites, toggleFavorite } = useProperties()

  // State to check if search has run
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'map'
  
  // Selected properties for comparison
  const [comparedIds, setComparedIds] = useState([])
  const [showComparison, setShowComparison] = useState(false)
  
  // Form/Input panel state
  const [preferences, setPreferences] = useState(() => {
    if (routerLocation.state?.preferences) {
      return routerLocation.state.preferences
    }
    return {
      budgetMin: 5000,
      budgetMax: 40000,
      propertyType: 'Flat',
      location: 'Dehradun',
      bedrooms: '2',
      bathrooms: '2',
      purpose: 'Rent',
      areaMin: 500,
      areaMax: 2000,
      amenities: ['wifi', 'parking', 'security'],
      nearby: ['Metro', 'School', 'Hospital'],
      lifestyle: ['Family', 'Working Professional'],
      moveInTime: '1 Month'
    }
  })

  // Local results filter options
  const [resultsFilter, setResultsFilter] = useState('Best Match') // 'Best Match' | 'Lowest Price' | 'Highest Price' | 'Highest Rated'

  // Search History and Saved Searches State
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_recent_searches')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  
  const [savedSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_saved_searches')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  // Persist history when updated
  useEffect(() => {
    localStorage.setItem('ai_recent_searches', JSON.stringify(recentSearches))
  }, [recentSearches])
  
  useEffect(() => {
    localStorage.setItem('ai_saved_searches', JSON.stringify(savedSearches))
  }, [savedSearches])

  const steps = [
    'Understanding requirements',
    'Matching preferences',
    'Searching listings',
    'Ranking properties',
    'Preparing recommendations'
  ]

  const startRecommendationFlow = () => {
    setIsProcessing(true)
    setProcessingStep(0)
    setShowResults(false)
    
    // Save to recent searches
    setRecentSearches(prev => {
      const newSearch = { id: Date.now(), timestamp: new Date().toISOString(), ...preferences }
      const updated = [newSearch, ...prev].slice(0, 5) // Keep last 5
      return updated
    })
    
    // Simulate step transition
    const interval = setInterval(() => {
      setProcessingStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval)
          setTimeout(() => {
            setIsProcessing(false)
            setShowResults(true)
            // Smooth scroll to results
            const resultsEl = document.getElementById('search-results-section')
            if (resultsEl) {
              resultsEl.scrollIntoView({ behavior: 'smooth' })
            }
          }, 600)
          return prev
        }
        return prev + 1
      })
    }, 800)
  }

  // Run search when preferences are loaded from router state
  useEffect(() => {
    if (routerLocation.state?.runImmediately) {
      setTimeout(() => startRecommendationFlow(), 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerLocation.state])

  // Handle preference input changes
  const toggleAmenity = (id) => {
    setPreferences(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter(x => x !== id)
        : [...prev.amenities, id]
    }))
  }

  const toggleNearby = (id) => {
    setPreferences(prev => ({
      ...prev,
      nearby: prev.nearby.includes(id)
        ? prev.nearby.filter(x => x !== id)
        : [...prev.nearby, id]
    }))
  }

  const toggleLifestyle = (id) => {
    setPreferences(prev => ({
      ...prev,
      lifestyle: prev.lifestyle.includes(id)
        ? prev.lifestyle.filter(x => x !== id)
        : [...prev.lifestyle, id]
    }))
  }

  // Recommendation engine matching algorithm (running locally on all properties)
  const recommendations = useMemo(() => {
    const baseProperties = listings && listings.length > 0 ? listings : MOCK_PROPERTIES
    
    const calculated = baseProperties.map(p => {
      let score = 85 // start with solid baseline
      
      // Budget matching
      const pPrice = Number(p.price)
      if (pPrice >= preferences.budgetMin && pPrice <= preferences.budgetMax) {
        score += 5
      } else {
        const diff = Math.abs(pPrice - (preferences.budgetMin + preferences.budgetMax) / 2)
        score -= Math.min(10, Math.floor(diff / 5000))
      }

      // Property type matching
      if (p.type && p.type.toLowerCase() === preferences.propertyType.toLowerCase()) {
        score += 5
      }

      // City matching
      if (p.city && p.city.toLowerCase() === preferences.location.toLowerCase()) {
        score += 5
      }

      // Amenities matching
      if (p.amenities) {
        const matchedAmenities = preferences.amenities.filter(a => p.amenities.includes(a))
        score += matchedAmenities.length * 1.5
      }

      // Ensure range is 0 to 100
      score = Math.max(65, Math.min(99, Math.round(score)))

      // Deterministic pseudo-random generation based on property ID to ensure React purity
      const seed = (p.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const pseudoRandom = (offset) => ((seed * offset) % 100) / 100

      const dMetro = (pseudoRandom(13) * 3 + 0.2).toFixed(1)
      const dSchool = (pseudoRandom(17) * 2 + 0.5).toFixed(1)
      const dHospital = (pseudoRandom(19) * 4 + 0.8).toFixed(1)

      // Dynamic tags
      let badge = 'Best Value'
      if (pPrice > 25000) badge = 'Luxury Pick'
      else if (score > 94) badge = 'Best Match'
      else if (preferences.lifestyle.includes('Family')) badge = 'Family Choice'
      else if (preferences.lifestyle.includes('Investment')) badge = 'Investment'

      // Investment Score calculation
      const growthPotential = Math.floor(pseudoRandom(23) * 12 + 6)
      const rentalYield = (pseudoRandom(29) * 3 + 4.5).toFixed(1)
      const appreciation = Math.floor(pseudoRandom(31) * 8 + 4)

      // EMI calculation
      const loanAmount = pPrice * 100 // Mock property value multiplier
      const monthlyRate = 0.085 / 12
      const months = 240
      const emiVal = Math.round(loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1))

      // Generating dynamic AI explanation
      const matchReason = `This property matches your criteria by fitting your budget of ₹${preferences.budgetMin.toLocaleString()} - ₹${preferences.budgetMax.toLocaleString()} and including requested amenities such as ${preferences.amenities.slice(0, 2).join(', ')}. Located in a premium sub-locality of ${p.city || 'Dehradun'} with convenient proximity to key hubs (${dMetro}km to transit), it features a strong forecasted value appreciation.`

      return {
        ...p,
        score,
        badge,
        distances: { metro: dMetro, school: dSchool, hospital: dHospital },
        investment: { growth: growthPotential, yield: rentalYield, appreciation },
        emi: emiVal,
        aiExplanation: matchReason
      }
    })

    // Sort results dynamically
    if (resultsFilter === 'Lowest Price') {
      return [...calculated].sort((a, b) => a.price - b.price)
    } else if (resultsFilter === 'Highest Price') {
      return [...calculated].sort((a, b) => b.price - a.price)
    } else if (resultsFilter === 'Highest Rated') {
      return [...calculated].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    } else if (resultsFilter === 'Newest') {
      return [...calculated].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }
    return [...calculated].sort((a, b) => b.score - a.score)
  }, [listings, preferences, resultsFilter])

  // Action helpers
  const handleSave = useCallback((propertyId) => {
    toggleFavorite(propertyId)
    toast.success('Property updated in your favorites!')
  }, [toggleFavorite])

  const findSimilar = useCallback((property) => {
    setPreferences(prev => ({
      ...prev,
      propertyType: property.type || prev.propertyType,
      budgetMin: Math.max(0, property.price - 5000),
      budgetMax: property.price + 10000,
      amenities: property.amenities || prev.amenities,
      location: property.city || prev.location
    }))
    toast.success(`Finding properties similar to ${property.title}`)
    startRecommendationFlow()
  }, [])

  const handleShare = (property) => {
    navigator.clipboard.writeText(`${window.location.origin}/property/${property.id}`)
    toast.success('Property link copied to clipboard!')
  }

  const handleDownloadPDF = () => {
    toast.loading('Generating your PDF report...', { duration: 1500 })
    setTimeout(() => {
      window.print()
    }, 1600)
  }

  const toggleCompare = (id) => {
    setComparedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : prev.length >= 3 
          ? (toast.error('You can compare a maximum of 3 properties'), prev)
          : [...prev, id]
    )
  }

  const comparedProperties = useMemo(() => {
    return recommendations.filter(p => comparedIds.includes(p.id))
  }, [recommendations, comparedIds])

  // Desktop sticky insights statistics
  const avgPrice = useMemo(() => {
    if (!recommendations.length) return 0
    return Math.round(recommendations.reduce((sum, p) => sum + Number(p.price), 0) / recommendations.length)
  }, [recommendations])

  const highestMatch = useMemo(() => {
    if (!recommendations.length) return 0
    return Math.max(...recommendations.map(p => p.score))
  }, [recommendations])

  return (
    <div className="min-h-screen bg-slate-50/50 text-gray-900 pb-24 pt-28 relative overflow-hidden">
      {/* Soft background glows and floating decorative shapes */}
      <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-red-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[600px] h-[600px] bg-blue-50/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Responsive Grid Layout */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ======================================================
           TOP HERO SECTION
           ====================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-red-600 text-xs font-semibold">
              <Sparkles size={14} className="text-[#CA3433]" />
              <span>Tailored Property Matching</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 font-display">
              AI Property Finder
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              Discover properties custom-matched to your lifestyle, budget parameters, and location preferences through our next-generation intelligent recommendation network.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => {
                  const target = document.getElementById('ai-search-card-anchor')
                  if (target) target.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-6 py-3 bg-[#CA3433] hover:bg-[#b02c2b] text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Start Search</span>
                <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => window.open('/search', '_self')}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-xl shadow-sm transition-all"
              >
                Browse Properties
              </button>
            </div>
          </div>

          {/* Right Side Abstract AI Illustration Card */}
          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="w-full h-80 rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-gray-100 shadow-xl p-6 relative overflow-hidden flex flex-col justify-between">
              {/* Grid backdrop */}
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Glass Cards Layout inside right illustration */}
              <div className="flex justify-between items-start z-10">
                <div className="bg-white/90 backdrop-blur border border-gray-100 p-4 rounded-2xl shadow-md max-w-[200px]">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#CA3433] mb-3">
                    <Compass size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Vector Search</h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-normal">Comparing 20+ preference parameters concurrently.</p>
                </div>
                
                <div className="bg-white/90 backdrop-blur border border-gray-100 p-4 rounded-2xl shadow-md max-w-[180px] -mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Growth</span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">+14.2%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-emerald-500 h-full w-[75%]" />
                  </div>
                </div>
              </div>

              {/* Progress Flow representation in illustration */}
              <div className="flex gap-2 items-center z-10 pt-4">
                <div className="flex-1 h-1 bg-red-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#CA3433] w-full animate-pulse" />
                </div>
                <div className="w-2 h-2 rounded-full bg-[#CA3433]" />
                <div className="flex-1 h-1 bg-slate-100 rounded-full" />
              </div>

              {/* Analytics graph block */}
              <div className="bg-[#CA3433] text-white p-4 rounded-2xl shadow-lg z-10 flex items-center justify-between mt-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <LineChart size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold">Matching Matrix</h5>
                    <p className="text-[9px] text-white/70">Optimization Level Alpha</p>
                  </div>
                </div>
                <span className="text-sm font-black bg-white/20 px-2 py-0.5 rounded-lg">99.4%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Anchor point */}
        <div id="ai-search-card-anchor" className="scroll-mt-28" />

        {/* ======================================================
           MAIN CONTENT REDESIGN (12-COLUMNS GRID)
           ====================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================
             LEFT SIDEBAR (STICKY SEARCH CARD / FORM)
             ====================================================== */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                <Compass className="text-[#CA3433]" size={20} />
                Match Criteria
              </h3>

              <div className="mt-5 space-y-5">
                {/* Purpose Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Purpose</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['Buy', 'Rent', 'Commercial'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPreferences(prev => ({ ...prev, purpose: mode }))}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${preferences.purpose === mode ? 'bg-[#CA3433] border-[#CA3433] text-white' : 'bg-slate-50 border-gray-100 hover:bg-slate-100 text-gray-600'}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Type & Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Type</label>
                    <select
                      value={preferences.propertyType}
                      onChange={e => setPreferences(prev => ({ ...prev, propertyType: e.target.value }))}
                      className="w-full bg-slate-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#CA3433] transition-colors font-medium"
                    >
                      {['Flat', 'Room', 'Hostel', 'PG'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Location</label>
                    <select
                      value={preferences.location}
                      onChange={e => setPreferences(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full bg-slate-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#CA3433] transition-colors font-medium"
                    >
                      {['Dehradun', 'Delhi', 'Noida', 'Rishikesh', 'Haridwar'].map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Budget Min/Max */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Monthly Budget (₹)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min Price"
                      value={preferences.budgetMin}
                      onChange={e => setPreferences(prev => ({ ...prev, budgetMin: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 focus:border-[#CA3433] outline-none font-medium"
                    />
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={preferences.budgetMax}
                      onChange={e => setPreferences(prev => ({ ...prev, budgetMax: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 focus:border-[#CA3433] outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Rooms Parameters */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Bedrooms</label>
                    <select
                      value={preferences.bedrooms}
                      onChange={e => setPreferences(prev => ({ ...prev, bedrooms: e.target.value }))}
                      className="w-full bg-slate-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#CA3433] transition-colors font-medium"
                    >
                      {['1', '2', '3', '4+'].map(num => <option key={num} value={num}>{num} BHK</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Bathrooms</label>
                    <select
                      value={preferences.bathrooms}
                      onChange={e => setPreferences(prev => ({ ...prev, bathrooms: e.target.value }))}
                      className="w-full bg-slate-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#CA3433] transition-colors font-medium"
                    >
                      {['1', '2', '3+'].map(num => <option key={num} value={num}>{num} Baths</option>)}
                    </select>
                  </div>
                </div>

                {/* Area Range */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Area Range (Sq. Ft.)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min Area"
                      value={preferences.areaMin}
                      onChange={e => setPreferences(prev => ({ ...prev, areaMin: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 focus:border-[#CA3433] outline-none font-medium"
                    />
                    <input
                      type="number"
                      placeholder="Max Area"
                      value={preferences.areaMax}
                      onChange={e => setPreferences(prev => ({ ...prev, areaMax: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 focus:border-[#CA3433] outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Move In Time */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Move-in timeframe</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Immediate', '1 Month', '3 Months', 'Flexible'].map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setPreferences(prev => ({ ...prev, moveInTime: time }))}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${preferences.moveInTime === time ? 'bg-slate-800 border-slate-800 text-white shadow-sm' : 'bg-slate-50 border-gray-100 hover:bg-slate-100 text-gray-600'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'wifi', label: 'WiFi' },
                      { id: 'gym', label: 'Gym' },
                      { id: 'parking', label: 'Parking' },
                      { id: 'security', label: 'Security' },
                      { id: 'furnished', label: 'Furnished' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleAmenity(item.id)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${preferences.amenities.includes(item.id) ? 'bg-red-50 border-red-200 text-red-700 shadow-sm' : 'bg-slate-50 border-gray-100 text-gray-600 hover:bg-slate-100'}`}
                      >
                        {preferences.amenities.includes(item.id) && <Check size={12} />}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transit & Proximity */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Proximity</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Metro', 'School', 'Hospital', 'Mall'].map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleNearby(item)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${preferences.nearby.includes(item) ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-slate-50 border-gray-100 text-gray-600 hover:bg-slate-100'}`}
                      >
                        {preferences.nearby.includes(item) && <Check size={12} />}
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lifestyle Preference */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Lifestyle</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Family', 'Bachelor', 'Working Professional', 'Investment'].map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleLifestyle(item)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${preferences.lifestyle.includes(item) ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-sm' : 'bg-slate-50 border-gray-100 text-gray-600 hover:bg-slate-100'}`}
                      >
                        {preferences.lifestyle.includes(item) && <Check size={12} />}
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Large Premium Search Button */}
                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startRecommendationFlow}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-[#CA3433] hover:bg-[#b02c2b] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Matching preferences...</span>
                      </>
                    ) : (
                      <>
                        <span>Run AI Finder</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </aside>

          {/* ======================================================
             RIGHT RESULTS PANEL (INLINE LOADING & PROPERTIES LIST)
             ====================================================== */}
          <main id="search-results-section" className="lg:col-span-8 space-y-8 scroll-mt-28">
            <AnimatePresence mode="wait">
              
              {/* ======================================================
                 1. INLINE LOADING PANEL (WHEN PROCESSING)
                 ====================================================== */}
              {isProcessing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col justify-center max-w-xl mx-auto"
                >
                  <div className="text-center space-y-4 mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Configuring Matches</h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">Evaluating property vectors against search profiles to select high-rating matches.</p>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6 relative">
                    <motion.div 
                      className="bg-[#CA3433] h-full" 
                      initial={{ width: '0%' }}
                      animate={{ width: `${((processingStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Steps Checklist */}
                  <div className="space-y-3.5 pl-4 max-w-xs mx-auto text-left">
                    {steps.map((step, idx) => (
                      <div 
                        key={step} 
                        className={`flex items-center gap-3 text-xs transition-all duration-300 ${idx === processingStep ? 'text-[#CA3433] font-bold scale-105' : idx < processingStep ? 'text-gray-500' : 'text-gray-300'}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${idx === processingStep ? 'bg-[#CA3433] shadow-[0_0_6px_#CA3433]' : idx < processingStep ? 'bg-gray-400' : 'bg-gray-200'}`} />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ======================================================
                 2. RESULTS DISPLAY (GRID OR MAP VIEW)
                 ====================================================== */}
              {!isProcessing && showResults && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6 text-left"
                >
                  {/* Results Header Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-700">
                        {recommendations.length} Recommendations Found
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Sort Selection */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-semibold">Sort:</span>
                        <select
                          value={resultsFilter}
                          onChange={e => setResultsFilter(e.target.value)}
                          className="bg-slate-50 border border-gray-100 rounded-lg text-xs font-semibold px-2 py-1 text-gray-700 outline-none"
                        >
                          {['Best Match', 'Lowest Price', 'Highest Price', 'Highest Rated', 'Newest'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div className="h-4 w-px bg-gray-200 hidden sm:block" />

                      {/* Download PDF */}
                      <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-bold border border-gray-200 transition-all active:scale-95 text-gray-700"
                      >
                        <Download size={13} />
                        <span>Download Report</span>
                      </button>

                      {/* Grid / Map Toggler */}
                      <div className="bg-slate-100 p-0.5 rounded-lg flex border border-gray-200">
                        <button 
                          onClick={() => setViewMode('grid')}
                          className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                          aria-label="Grid View"
                        >
                          <Grid size={14} />
                        </button>
                        <button 
                          onClick={() => setViewMode('map')}
                          className={`p-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                          aria-label="Map View"
                        >
                          <Map size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comparisons banner when items are checked */}
                  {comparedIds.length > 0 && (
                    <div className="bg-slate-900 text-white rounded-2xl px-6 py-4 flex items-center justify-between gap-4 shadow-lg">
                      <div className="text-sm font-semibold">
                        Selected <span className="text-[#CA3433] font-black">{comparedIds.length}</span> / 3 properties for comparison
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setComparedIds([])}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Reset
                        </button>
                        <button 
                          onClick={() => setShowComparison(true)}
                          className="px-4 py-1.5 bg-[#CA3433] hover:bg-[#b02c2b] text-white rounded-lg text-xs font-bold shadow-md transition-all"
                        >
                          Compare Side-by-Side
                        </button>
                      </div>
                    </div>
                  )}

                  {/* View Mode Rendering: Grid View vs Map View */}
                  {recommendations.length === 0 ? (
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                        <Search size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">No Matching Properties</h3>
                      <p className="text-sm text-gray-500 max-w-sm mb-6">
                        We couldn't find any properties matching your exact strict criteria. Try expanding your budget, or removing some amenities.
                      </p>
                      <button
                        onClick={() => {
                          setPreferences(prev => ({
                            ...prev,
                            budgetMax: prev.budgetMax + 10000,
                            amenities: []
                          }))
                          startRecommendationFlow()
                        }}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                      >
                        Broaden Search Criteria
                      </button>
                    </div>
                  ) : viewMode === 'grid' ? (
                    
                    /* Grid Layout of Property Cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recommendations.map((property) => (
                        <AiPropertyCard 
                          key={property.id} 
                          property={{...property, isFavorite: favorites.includes(property.id)}}
                          comparedIds={comparedIds}
                          toggleCompare={toggleCompare}
                          handleSave={handleSave}
                          handleShare={handleShare}
                          findSimilar={findSimilar}
                        />
                      ))}
                    </div>

                  ) : (
                    
                    /* Map View Layout */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px] text-left">
                      {/* Left list pane */}
                      <div className="lg:col-span-1 space-y-3 overflow-y-auto pr-2 h-full scrollbar-thin">
                        {recommendations.map(p => (
                          <div 
                            key={`map-item-${p.id}`}
                            onClick={() => toast.success(`Selected ${p.title} on map`)}
                            className="bg-white border border-gray-200/80 p-3 rounded-xl flex gap-3 cursor-pointer hover:bg-slate-50 transition-all shadow-sm"
                          >
                            <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                              <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="min-w-0 flex flex-col justify-between py-0.5">
                              <h4 className="text-xs font-bold text-gray-900 truncate">{p.title}</h4>
                              <p className="text-xs font-black text-gray-800">₹{Number(p.price).toLocaleString('en-IN')}</p>
                              <span className="text-[9px] font-extrabold text-[#CA3433] uppercase">{p.score}% Match</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Map frame simulation */}
                      <div className="lg:col-span-2 bg-slate-50 rounded-2xl border border-gray-200 overflow-hidden relative shadow-inner">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#CA3433_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
                        
                        {/* Render markers for each recommendation */}
                        {recommendations.map((p, index) => {
                           // deterministic pseudo-random positioning
                           const seed = (p.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                           const top = 15 + ((seed * 13) % 70) // 15% to 85%
                           const left = 10 + ((seed * 17) % 80) // 10% to 90%
                           
                           return (
                             <div 
                               key={`marker-${p.id}`}
                               className="absolute group cursor-pointer"
                               style={{ top: `${top}%`, left: `${left}%` }}
                               onClick={() => {
                                 toast.success(`Selected ${p.title}`)
                                 navigate(`/property/${p.id}`)
                               }}
                             >
                               <div className="relative">
                                 <div className="w-8 h-8 rounded-full bg-white border-2 border-[#CA3433] shadow-md flex items-center justify-center text-[#CA3433] z-10 relative group-hover:scale-110 transition-transform">
                                   <MapPin size={14} className="fill-red-50" />
                                 </div>
                                 <div className="absolute -bottom-1 -left-1 w-10 h-10 bg-[#CA3433] opacity-20 rounded-full animate-ping -z-10" style={{ animationDelay: `${index * 0.2}s` }} />
                                 
                                 {/* Tooltip */}
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                   ₹{Number(p.price).toLocaleString('en-IN')}
                                   <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                 </div>
                               </div>
                             </div>
                           )
                        })}

                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-gray-200 flex items-center justify-between text-xs shadow-sm">
                          <span className="text-gray-700 font-semibold">Showing {recommendations.length} matching nodes in {preferences.location}</span>
                          <span className="text-green-600 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Grid</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Desktop Only Insights Panel */}
                  <div className="hidden lg:grid grid-cols-4 gap-4 mt-8 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="col-span-4 pb-2 border-b border-gray-100">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        <LineChart size={15} className="text-[#CA3433]" />
                        Search Insights & Metrics
                      </h4>
                    </div>
                    <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Average Monthly Rent</span>
                      <span className="text-lg font-black text-gray-900">₹{avgPrice.toLocaleString('en-IN')}</span>
                      <p className="text-[9px] text-gray-500 mt-1">Based on matches</p>
                    </div>
                    <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Highest Match Level</span>
                      <span className="text-lg font-black text-gray-900">{highestMatch}% Match</span>
                      <p className="text-[9px] text-gray-500 mt-1">Precise criteria fit</p>
                    </div>
                    <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Best Appreciating Zone</span>
                      <span className="text-lg font-black text-emerald-600">Rajpur Road</span>
                      <p className="text-[9px] text-gray-500 mt-1">Up to +12% annually</p>
                    </div>
                    <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Demand Trend</span>
                      <span className="text-lg font-black text-[#CA3433]">High Demand</span>
                      <p className="text-[9px] text-gray-500 mt-1">Limited inventories</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ======================================================
                 3. INITIAL / EMPTY STATE
                 ====================================================== */}
              {!isProcessing && !showResults && (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-gray-200 rounded-3xl p-12 shadow-sm text-center space-y-5"
                >
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-[#CA3433] mx-auto">
                    <Search size={26} />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">Define Search Criteria</h3>
                    <p className="text-sm text-gray-500">Select your preferred location, BHK sizes, and nearby options in the left side criteria panel and click "Run AI Finder" to list matching properties.</p>
                  </div>

                  <div className="pt-4 max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="border border-gray-100 p-4 rounded-2xl bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Popular Searches</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['2 BHK Tapovan', 'Affordable PGs', 'Noida Studio'].map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              if (tag.includes('PG')) {
                                setPreferences(prev => ({ ...prev, propertyType: 'PG', bedrooms: '1' }))
                              } else if (tag.includes('Studio')) {
                                setPreferences(prev => ({ ...prev, propertyType: 'Room', location: 'Noida' }))
                              } else {
                                setPreferences(prev => ({ ...prev, propertyType: 'Flat', location: 'Dehradun', bedrooms: '2' }))
                              }
                              startRecommendationFlow()
                            }}
                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-[10px] text-gray-600 rounded font-semibold border border-gray-100 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {recentSearches.length > 0 && (
                      <div className="border border-gray-100 p-4 rounded-2xl bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Searches</h4>
                          <button onClick={() => setRecentSearches([])} className="text-[10px] text-gray-400 hover:text-gray-600 font-medium">Clear</button>
                        </div>
                        <div className="flex flex-col gap-2">
                          {recentSearches.slice(0, 3).map((search) => (
                            <button
                              key={search.id}
                              onClick={() => {
                                const { id, timestamp, ...rest } = search;
                                setPreferences(rest);
                                startRecommendationFlow();
                              }}
                              className="text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 text-xs text-gray-700 rounded-lg font-semibold border border-gray-100 transition-colors flex items-center justify-between"
                            >
                              <span className="truncate max-w-[200px]">{search.propertyType} • {search.location} • ₹{search.budgetMax.toLocaleString()}</span>
                              <ArrowRight size={12} className="text-gray-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </main>

        </div>

      </div>

      {/* ======================================================
         SIDE-BY-SIDE PROPERTY COMPARISON DRAWER
         ====================================================== */}
      <AnimatePresence>
        {showComparison && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white border border-gray-200 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between text-left">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ArrowLeftRight className="text-[#CA3433]" />
                  Side-by-Side Property Comparison
                </h3>
                <button 
                  onClick={() => setShowComparison(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-gray-500 transition-colors"
                  aria-label="Close Comparison"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-x-auto text-left">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 font-bold text-gray-400 w-1/4">Parameters</th>
                      {comparedProperties.map(p => (
                        <th key={p.id} className="py-3 px-4 text-center font-extrabold text-gray-900 w-1/4">
                          {p.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-500">Match Score</td>
                      {comparedProperties.map(p => (
                        <td key={p.id} className="py-3 px-4 text-center font-bold text-[#CA3433]">{p.score}%</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-500">Rent (Monthly)</td>
                      {comparedProperties.map(p => (
                        <td key={p.id} className="py-3 px-4 text-center font-bold text-gray-900">₹{Number(p.price).toLocaleString('en-IN')}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-500">Location</td>
                      {comparedProperties.map(p => (
                        <td key={p.id} className="py-3 px-4 text-center">{p.area || 'Central'}, {p.city}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-500">Estimated EMI</td>
                      {comparedProperties.map(p => (
                        <td key={p.id} className="py-3 px-4 text-center font-medium">₹{p.emi.toLocaleString('en-IN')}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-500">Investment Growth</td>
                      {comparedProperties.map(p => (
                        <td key={p.id} className="py-3 px-4 text-center text-emerald-600 font-bold">+{p.investment.growth}%</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-500">Amenities</td>
                      {comparedProperties.map(p => (
                        <td key={p.id} className="py-3 px-4 text-center text-[10px] text-gray-400">
                          {p.amenities?.slice(0, 3).join(', ') || 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-500">Transit Distance</td>
                      {comparedProperties.map(p => (
                        <td key={p.id} className="py-3 px-4 text-center">{p.distances.metro} km</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-slate-50 border-t border-gray-200 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowComparison(false)}>Close View</Button>
                <Button variant="primary" className="bg-[#CA3433] hover:bg-[#b02c2b] text-white font-extrabold" onClick={() => { setShowComparison(false); handleDownloadPDF(); }}>Print Comparison</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
