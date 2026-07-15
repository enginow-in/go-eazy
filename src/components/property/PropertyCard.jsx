import React, { useState, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Bookmark, Star, Home, Eye } from 'lucide-react'
import { openAuthModal } from '../../store/authSlice'
import { useProperties } from '../../hooks/useProperties'
import { cn } from '../../utils/helpers'
import { useTranslation } from 'react-i18next'

// Master geographic coordinates for local university campuses
const CAMPUS_COORDINATES = {
  Dehradun: { name: 'UPES Bidholi', lat: 30.4034, lng: 77.9667 },
  Srinagar: { name: 'HNBGU Chauras', lat: 30.2281, lng: 78.7831 }
};

// Haversine formula calculation logic to determine distance on a sphere
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

const PropertyCardComponent = ({ property, layout = 'grid', compact = false, condensed = false, badge = null }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const { favorites, toggleFavorite } = useProperties()
  const [imgLoaded, setImgLoaded] = useState(false)

  const isFav = favorites.includes(property.id)
  const images = property.images || []
  const mainImage = images[0]

  const handleFav = (e) => {
    e.stopPropagation()
    if (!user) { dispatch(openAuthModal('signup')); return }
    toggleFavorite(property.id)
  }

  // Memoize values with deterministic calculation
  const { rating, numBeds } = useMemo(() => {
    return {
      rating: property.rating || '0.0',
      bedrooms: property.bedrooms || 0,
    }
  }, [property.rating, property.bedrooms])

  // Resolve coordinate metrics based on listing city mapping
  const proximityText = useMemo(() => {
    const campus = CAMPUS_COORDINATES[property.city];
    if (!campus) return '';
    
    // Generate deterministic coordinate shifts using property ID if coordinates are missing
    const seed = property.id ? property.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.random();
    const propLat = property.lat || (campus.lat + (parseFloat('0.' + (seed * 3 % 1000).toFixed(0)) - 0.5) * 0.015);
    const propLng = property.lng || (campus.lng + (parseFloat('0.' + (seed * 7 % 1000).toFixed(0)) - 0.5) * 0.015);
    
    const distance = calculateDistance(campus.lat, campus.lng, propLat, propLng);
    return `${distance.toFixed(1)} km from ${campus.name}`;
  }, [property.city, property.id, property.lat, property.lng]);

  const formatPrice = (p) => {
    if (!p) return '0'
    const num = Number(p)
    return num.toLocaleString('en-IN')
  }

  // List Layout (Matches Image 2)
  if (layout === 'list') {
    return (
      <div 
        className="group bg-white rounded-2xl border border-gray-100 flex gap-4 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
        onClick={() => navigate(`/property/${property.id}`)}
      >
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 overflow-hidden bg-gray-50 rounded-r-2xl shadow-sm">
          <img 
            src={mainImage} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
          />
          {!imgLoaded && <div className="skeleton absolute inset-0" />}
          {badge && <div className="absolute bottom-2 left-2 z-20">{badge}</div>}
          <button
            onClick={handleFav}
            className={cn(
              "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all",
              isFav ? "bg-brand-500 text-white shadow-lg" : "bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white"
            )}
          >
            <Bookmark size={14} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex-1 py-3 flex flex-col justify-between min-w-0 pr-4">
          <div>
            <span className={cn(
              "font-extrabold text-gray-400 uppercase tracking-[0.1em] mb-0.5 block",
              condensed ? "text-[8px]" : "text-[10px]"
            )}>
              {t(`property.types.${property.type}`) || property.type || 'ROOM'}
            </span>
            <h3 className={cn(
              "font-black text-gray-900 leading-tight line-clamp-1 mb-1",
              condensed ? "text Red" : "text-base sm:text-lg"
            )}>
              {property.title}
            </h3>
            
            {/* Distance Indicator Badge */}
            {proximityText && (
              <div className="mt-1 flex items-center">
                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-medium text-[#CA3433] ring-1 ring-inset ring-red-600/10">
                  📍 {proximityText}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-end justify-between mt-auto pb-0.5">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">{t('property.labels.from')}</span>
              <span className={cn(
                "font-black text-gray-900 leading-none",
                condensed ? "text-base" : "text-base sm:text-lg"
              )}>₹{formatPrice(property.price)}</span>
            </div>
            
            <div className={cn(
              "flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-100 shadow-sm",
              condensed ? "px-1.5 py-0.5" : "px-2 py-1"
            )}>
              <span className={cn("font-black text-gray-900", condensed ? "text-[10px]" : "text-xs")}>{rating}</span>
              <Star size={condensed ? 8 : 10} fill="currentColor" className="text-orange-400" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard / Compact Layout
  if (compact) {
    return (
      <div 
        className="group bg-white rounded-2xl border border-gray-100 w-60 flex-shrink-0 overflow-hidden cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        onClick={() => navigate(`/property/${property.id}`)}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-b-xl">
          <img src={mainImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[8px] font-black text-brand-600 uppercase tracking-wider">
             {t(`property.types.${property.type}`) || property.type}
          </div>
          {badge && <div className="absolute bottom-2 left-2 z-20">{badge}</div>}
        </div>
        <div className="px-3 py-2">
          <h3 className={cn(
            "font-bold text-gray-900 line-clamp-1 mb-0.5",
            condensed ? "text-[11px]" : "text-[13px]"
          )}>{property.title}</h3>

          {/* Distance Indicator Badge */}
          {proximityText && (
            <div className="mb-1.5 flex items-center">
              <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-[#CA3433] ring-1 ring-inset ring-red-600/10">
                📍 {proximityText}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold">
             <span className={cn("text-gray-900", condensed ? "text-[11px]" : "text-[13px]")}>₹{formatPrice(property.price)}</span>
             <div className="flex items-center gap-0.5 text-gray-900">
               <Star size={9} className="text-orange-400" fill="currentColor" />
               <span className={condensed ? "text-[9px]" : "text-[10px]"}>{rating}</span>
             </div>
          </div>
        </div>
      </div>
    )
  }

  // Standard Grid Layout (Default)
  return (
    <div
      className={cn(
        'group bg-white rounded-2xl border border-gray-100 shadow-md',
        'hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden'
      )}
      onClick={() => navigate(`/property/${property.id}`)}
    >
      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden rounded-b-2xl shadow-sm">
        <img
          src={mainImage}
          alt={property.title}
          className={cn(
            'w-full h-full object-cover group-hover:scale-110 transition-transform duration-700',
            imgLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImgLoaded(true)}
          loading="lazy"
        />
        {!imgLoaded && <div className="skeleton absolute inset-0" />}
        {badge && <div className="absolute bottom-2 left-2 z-20">{badge}</div>}
        <button
          onClick={handleFav}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-10',
            'transition-all duration-200 shadow-sm transition-opacity',
            isFav ? 'bg-brand-500 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-600'
          )}
        >
          <Bookmark size={14} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="px-3 py-2 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn(
            "font-black text-gray-400 uppercase tracking-widest",
            condensed ? "text-[8px]" : "text-[9px]"
          )}>
            {t(`property.types.${property.type}`) || property.type}
          </span>
          <div className="flex items-center gap-1 bg-gray-50/50 px-1 py-0.5 rounded-lg">
            <span className={cn("font-black text-gray-900", condensed ? "text-[8px]" : "text-[9px]")}>{rating}</span>
            <Star size={condensed ? 8 : 9} className="text-orange-400" fill="currentColor" />
          </div>
        </div>
        
        <h3 className={cn(
          "font-extrabold text-gray-900 leading-tight line-clamp-1 mb-1",
          condensed ? "text-[11px]" : "text-sm"
        )}>
          {property.title}
        </h3>
        
        {/* Distance Indicator Badge */}
        {proximityText && (
          <div className="mb-2 flex items-center">
            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-medium text-[#CA3433] ring-1 ring-inset ring-red-600/10">
              📍 {proximityText}
            </span>
          </div>
        )}
        
        <div className="mt-auto pt-1.5 border-t border-gray-50 flex items-center justify-between">
          <p className="flex flex-col">
            <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">{t('property.labels.from')}</span>
            <span className={cn(
              "font-black text-gray-900 leading-tight",
              condensed ? "text-sm" : "text-base"
            )}>₹{formatPrice(property.price)}</span>
          </p>
         <a 
  href={`https://api.whatsapp.com/send?phone=919999999999&text=${encodeURIComponent(
    `Hello! I am highly interested in the "${property.title}" listed on GoEazy for ₹${formatPrice(property.price)}/month. Is it still available for booking?`
  )}`}
  target="_blank"
  rel="noopener noreferrer"
  onClick={(e) => e.stopPropagation()} // Prevents navigating to details page
  className="text-emerald-600 hover:text-emerald-700 transition-colors p-1 hover:bg-emerald-50 rounded-lg"
  title="Inquire on WhatsApp"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397 0 11.93 0c3.165.001 6.14 1.233 8.377 3.474 2.237 2.24 3.466 5.216 3.466 8.385 0 6.585-5.337 11.933-11.87 11.933-2.01 0-3.99-.51-5.747-1.48L0 24zm6.59-4.846c1.657.983 3.284 1.503 4.675 1.503 5.432 0 9.854-4.38 9.856-9.764 0-2.608-1.015-5.06-2.859-6.908C16.435 2.137 13.99 1.113 11.93 1.113c-5.437 0-9.859 4.38-9.86 9.764 0 1.5.4 2.964 1.16 4.246L2.21 19.83l4.437-1.154z"/>
  </svg>
</a>
        </div>
      </div>
    </div>
  )
}

export const PropertyCard = memo(PropertyCardComponent)