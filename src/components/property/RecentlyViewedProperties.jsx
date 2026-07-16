import React, { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { PropertyCard } from './PropertyCard'
import { Skeleton } from '../ui/Skeleton'
import { useTranslation } from 'react-i18next'

export const RecentlyViewedProperties = () => {
  const { t } = useTranslation()
  const { recentlyViewed, fetchPropertiesByIds } = useProperties()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadProperties = async () => {
      if (!recentlyViewed || recentlyViewed.length === 0) {
        setProperties([])
        return
      }
      setLoading(true)
      try {
        const data = await fetchPropertiesByIds(recentlyViewed)
        setProperties(data || [])
      } catch (err) {
        console.error('Error loading recently viewed properties:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProperties()
  }, [recentlyViewed, fetchPropertiesByIds])

  if (!recentlyViewed || recentlyViewed.length === 0) return null

  const LoadingRow = () => (
    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex-shrink-0 w-64 rounded-xl bg-white border border-gray-100 p-3 space-y-3 shadow-[0_2px_8px_rgb(0,0,0,0.02)]">
          <Skeleton className="h-44 w-full rounded-xl" />
          <div className="space-y-2 px-1">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <div className="pt-1 flex gap-2">
              <Skeleton className="h-3 w-1/4 rounded-full" />
              <Skeleton className="h-3 w-1/4 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#CA3433]">
          <Clock size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 font-display leading-none">
            {t('property.sections.recentlyViewed') || 'Recently Viewed Properties'}
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-semibold tracking-wide uppercase">
            {t('property.sections.recentlyViewedDesc') || 'Your recently viewed homes'}
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingRow />
      ) : properties.length === 0 ? null : (
        <div className="scroll-row px-1 -mx-1 flex gap-5 overflow-x-auto pb-4 customize-scrollbar">
          {properties.map(p => (
            <div key={p.id} className="flex-shrink-0 w-64">
              <PropertyCard property={p} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
