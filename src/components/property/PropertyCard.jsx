import React, { useState, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Bookmark, Star, Home, Eye } from 'lucide-react'
import { openAuthModal } from '../../store/authSlice'
import { useProperties } from '../../hooks/useProperties'
import { cn } from '../../utils/helpers'
import { useTranslation } from 'react-i18next'

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
      numBeds: property.bedrooms || 0,
    }
  }, [property.rating, property.bedrooms])

  const formatPrice = (p) => {
    if (!p) return '0'
    const num = Number(p)
    return num.toLocaleString('en-IN')
  }

  // List Layout (Matches Image 2)
  if (layout === 'list') {
    return (
      <div 
        className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 flex gap-4 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
        onClick={() => navigate(`/property/${property.id}`)}
      >
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 overflow-hidden bg-gray-50 dark:bg-slate-950 rounded-r-2xl shadow-sm">
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
              isFav ? "bg-brand-500 text-white shadow-lg" : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-800"
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
              "font-black text-gray-900 dark:text-white leading-tight line-clamp-1 mb-1",
              condensed ? "text-sm" : "text-base sm:text-lg"
            )}>
              {property.title}
            </h3>
          </div>

          <div className="flex items-end justify-between mt-auto pb-0.5">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">{t('property.labels.from')}</span>
              <span className={cn(
                "font-black text-gray-900 dark:text-white leading-none",
                condensed ? "text-base" : "text-base sm:text-lg"
              )}>₹{formatPrice(property.price)}</span>
            </div>
            
            <div className={cn(
              "flex items-center gap-1 bg-gray-50 dark:bg-slate-850 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm",
              condensed ? "px-1.5 py-0.5" : "px-2 py-1"
            )}>
              <span className={cn("font-black text-gray-900 dark:text-white", condensed ? "text-[10px]" : "text-xs")}>{rating}</span>
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
        className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 w-60 flex-shrink-0 overflow-hidden cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        onClick={() => navigate(`/property/${property.id}`)}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-b-xl">
          <img src={mainImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-[8px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider">
             {t(`property.types.${property.type}`) || property.type}
          </div>
          {badge && <div className="absolute bottom-2 left-2 z-20">{badge}</div>}
        </div>
        <div className="px-3 py-2">
          <h3 className={cn(
            "font-bold text-gray-900 dark:text-white line-clamp-1 mb-0.5",
            condensed ? "text-[11px]" : "text-[13px]"
          )}>{property.title}</h3>
          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 font-bold">
             <span className={cn("text-gray-900 dark:text-white", condensed ? "text-[11px]" : "text-[13px]")}>₹{formatPrice(property.price)}</span>
             <div className="flex items-center gap-0.5 text-gray-900 dark:text-white">
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
        'group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-md',
        'hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden'
      )}
      onClick={() => navigate(`/property/${property.id}`)}
    >
      <div className="relative w-full aspect-[4/3] bg-gray-50 dark:bg-slate-950 overflow-hidden rounded-b-2xl shadow-sm">
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
            isFav ? 'bg-brand-500 text-white' : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-gray-600 dark:text-gray-400'
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
          <div className="flex items-center gap-1 bg-gray-50/50 dark:bg-slate-800/50 px-1 py-0.5 rounded-lg">
            <span className={cn("font-black text-gray-900 dark:text-white", condensed ? "text-[8px]" : "text-[9px]")}>{rating}</span>
            <Star size={condensed ? 8 : 9} className="text-orange-400" fill="currentColor" />
          </div>
        </div>
        
        <h3 className={cn(
          "font-extrabold text-gray-900 dark:text-white leading-tight line-clamp-1 mb-0.5",
          condensed ? "text-[11px]" : "text-sm"
        )}>
          {property.title}
        </h3>
        
        
        <div className="mt-auto pt-1.5 border-t border-gray-50 dark:border-slate-850 flex items-center justify-between">
          <p className="flex flex-col">
            <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">{t('property.labels.from')}</span>
            <span className={cn(
              "font-black text-gray-900 dark:text-white leading-tight",
              condensed ? "text-sm" : "text-base"
            )}>₹{formatPrice(property.price)}</span>
          </p>
          <button className="text-[#CA3433] hover:text-brand-800 dark:hover:text-brand-400 transition-colors">
            <Eye size={condensed ? 14 : 18} />
          </button>
        </div>
      </div>
    </div>
  )
}



export const PropertyCard = memo(PropertyCardComponent)
