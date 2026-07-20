import React, { useEffect, useState } from 'react'
import { ChevronRight, Flame } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { PropertyCard } from '../property/PropertyCard'
import { useProperties } from '../../hooks/useProperties'
import { setFilters } from '../../store/propertySlice'
import { MOCK_PROPERTIES } from '../../utils/constants'

import { Skeleton } from '../ui/Skeleton'

const SectionSkeleton = () => (
  <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
    {[1,2,3,4].map(i => (
      <div key={i} className="flex-shrink-0 w-64 rounded-xl bg-white border border-gray-100 overflow-hidden p-3 space-y-3">
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

export const PropertySection = ({ title, type, icon, viewAllPath }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { fetchByType } = useProperties()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchByType(type)
      setItems(data?.length ? data : MOCK_PROPERTIES.filter(p => p.type === type))
      setLoading(false)
    }
    
    loadData()
  }, [type, fetchByType])

  if (!loading && items.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-display font-bold text-xl text-gray-900">{title}</h2>
          {!loading && (
            <span className="text-sm text-gray-400 font-medium ml-1">({items.length})</span>
          )}
        </div>
        <button
          onClick={() => {
            dispatch(setFilters({ type: type === 'all' ? '' : type }))
            navigate(viewAllPath || '/search')
          }}
          className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-700 transition-colors"
        >
          View all <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <SectionSkeleton />
      ) : (
        <div className="scroll-row">
          {items.map(property => (
            <div key={property.id} className="flex-shrink-0">
              <PropertyCard property={property} compact />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export const FeaturedSection = () => {
  const { featured, fetchFeatured, loading } = useProperties()
  const items = featured.length ? featured : [...MOCK_PROPERTIES].sort((a,b) => b.views - a.views).slice(0,6)

  useEffect(() => { fetchFeatured() }, [])

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Flame size={24} className="text-orange-500" />
          <h2 className="font-display font-bold text-xl text-gray-900">Most Popular</h2>
        </div>
        <Link to="/search" className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-700 transition-colors">
          View all <ChevronRight size={16} />
        </Link>
      </div>
      {loading ? (
        <SectionSkeleton />
      ) : (
        <div className="scroll-row">
          {items.map(property => (
            <div key={property.id} className="flex-shrink-0">
              <PropertyCard property={property} compact />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
