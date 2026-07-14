import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProperties } from '../../hooks/useProperties'
import { rankRelatedProperties } from '../../utils/recommendation'
import { Skeleton } from '../ui/Skeleton'
import { PropertyCard } from './PropertyCard'

export const RelatedProperties = ({ property }) => {
  const { t } = useTranslation()
  const { fetchRelatedProperties } = useProperties()
  const [loading, setLoading] = useState(false)
  const [related, setRelated] = useState([])

  useEffect(() => {
    const load = async () => {
      if (!property) return
      setLoading(true)
      try {
        const candidates = await fetchRelatedProperties(property)
        const ranked = rankRelatedProperties(property, candidates, 6)
        setRelated(ranked)
      } catch (err) {
        console.error('Failed to load related properties', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [property, fetchRelatedProperties])

  if (!property) return null

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight font-display">
        {t('property.sections.relatedProperties', 'Related Properties')}
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : related.length === 0 ? (
        <div className="p-8 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center text-gray-600">
          {t('property.sections.noRelated', 'No similar properties found at the moment.')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {related.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      )}
    </section>
  )
}