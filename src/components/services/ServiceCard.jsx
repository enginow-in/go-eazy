import React, { useState, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Eye, MapPin, CheckCircle } from 'lucide-react'
import { cn } from '../../utils/helpers'
import { useTranslation } from 'react-i18next'

const getCategoryConfig = (t) => ({
  tiffin:   { label: t('nearby.categories.tiffin'),   emoji: '🍱', color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  laundry:  { label: t('nearby.categories.laundry'),  emoji: '🧺', color: 'bg-blue-100 text-blue-700',   border: 'border-blue-200' },
  cleaning: { label: t('nearby.categories.cleaning'), emoji: '🧹', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
})

const ServiceCardComponent = ({ service, layout = 'grid' }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [imgLoaded, setImgLoaded] = useState(false)
  
  const categoryConfig = getCategoryConfig(t)
  const cat = categoryConfig[service.category] || { label: service.category, emoji: '🛠️', color: 'bg-gray-100 text-gray-700' }
  const mainImage = (service.images && service.images[0]) || null

  // Memoize values with deterministic calculation
  const { rating } = useMemo(() => {
    return {
      rating: service.avg_rating || '0.0',
    }
  }, [service.avg_rating])

  const formatPrice = (p) => {
    if (!p) return '0'
    const num = Number(p)
    return num.toLocaleString('en-IN')
  }

  // Get first available price from listings
  const firstPrice = service.service_listings?.[0]?.price || 0

  if (layout === 'list') {
    return (
      <div 
        className="group bg-white rounded-2xl border border-gray-100 flex gap-4 p-1.5 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        onClick={() => navigate(`/services/${service.id}`)}
      >
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100/50">
          {mainImage ? (
            <img 
              src={mainImage} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
               <span className="text-3xl">{cat.emoji}</span>
            </div>
          )}
          {mainImage && !imgLoaded && <div className="skeleton absolute inset-0" />}
          
          <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[8px] font-black text-gray-900 uppercase tracking-wider flex items-center gap-1">
             <span>{cat.emoji}</span> {cat.label}
          </div>
        </div>

        <div className="flex-1 py-1 flex flex-col justify-between min-w-0 pr-2">
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.1em] mb-0.5 block">
              {service.area}
            </span>
            <h3 className="font-black text-gray-900 text-base sm:text-lg leading-tight line-clamp-1 mb-1 group-hover:text-[#CA3433] transition-colors">
              {service.name}
            </h3>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500 line-clamp-2">
              {service.speciality || service.description || t('service.labels.descriptionFallback')}
            </p>
          </div>

          <div className="flex items-end justify-between mt-auto pb-0.5">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">{t('services.labels.startingFrom')}</span>
              <span className="font-black text-gray-900 text-base sm:text-lg leading-none">₹{formatPrice(firstPrice)}</span>
            </div>
            
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
              <span className="font-black text-xs text-gray-900">{rating}</span>
              <Star size={10} fill="currentColor" className="text-orange-400" />
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
      onClick={() => navigate(`/services/${service.id}`)}
    >
      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden rounded-b-2xl">
        {mainImage ? (
          <img
            src={mainImage}
            alt={service.name}
            className={cn(
              'w-full h-full object-cover group-hover:scale-110 transition-transform duration-700',
              imgLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2 bg-gray-50">
             <span className="text-5xl opacity-40">{cat.emoji}</span>
          </div>
        )}
        {mainImage && !imgLoaded && <div className="skeleton absolute inset-0" />}
        
        <div className="absolute top-2 left-2 px-2.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-xl text-[9px] font-black text-gray-900 uppercase tracking-widest shadow-sm border border-gray-100 flex items-center gap-1.5">
           <span>{cat.emoji}</span> {cat.label}
        </div>
      </div>

      <div className="px-3.5 py-2.5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <MapPin size={10} /> {service.area}, {t(`cities.${service.city}`) || service.city}
          </span>
          <div className="flex items-center gap-1 bg-gray-50/50 px-1 py-0.5 rounded-lg">
            <span className="font-black text-[9px] text-gray-900">{rating}</span>
            <Star size={9} className="text-orange-400" fill="currentColor" />
          </div>
        </div>
        
        <h3 className="font-extrabold text-gray-900 text-sm leading-tight line-clamp-1 mb-1 group-hover:text-[#CA3433] transition-colors">
          {service.name}
        </h3>
        
        <p className="text-[11px] text-gray-500 font-bold mb-2 line-clamp-1">
           {service.speciality || t('services.labels.descriptionFallback') || t('services.labels.aboutFallback')}
        </p>
        
        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">{t('services.labels.from')}</span>
            <span className="font-black text-gray-900 text-base leading-tight">₹{formatPrice(firstPrice)}</span>
          </div>
          <button className="text-[#CA3433] hover:text-brand-800 transition-colors">
            <Eye size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export const ServiceCard = memo(ServiceCardComponent)
