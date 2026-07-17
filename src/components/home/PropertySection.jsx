import React, { useEffect, useState, useRef } from 'react'
import { ChevronRight, Flame } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { PropertyCard } from '../property/PropertyCard'
import { useProperties } from '../../hooks/useProperties'
import { setFilters } from '../../store/propertySlice'
import { MOCK_PROPERTIES } from '../../utils/constants'
import { Skeleton } from '../ui/Skeleton'

const SectionSkeleton = () => (
  <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex-shrink-0 w-64 rounded-xl bg-white border border-gray-100 overflow-hidden p-3 space-y-3">
        <Skeleton className="h-44 w-full rounded-xl" variant="rectangle" />
        <div className="space-y-2 px-1">
          <Skeleton className="h-5 w-4/5" variant="text" />
          <Skeleton className="h-4 w-3/5" variant="text" />
          <div className="pt-1 flex gap-2">
            <Skeleton className="h-3 w-1/4" variant="rectangle" className="rounded-full" />
            <Skeleton className="h-3 w-1/4" variant="rectangle" className="rounded-full" />
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
  
  // Inherit global query criteria parameters safely
  const currentFilters = useSelector((state) => state.properties?.filters || {})
  const fetchRef = useRef(fetchByType)

  useEffect(() => {
    fetchRef.current = fetchByType
  }, [fetchByType])

  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await fetchRef.current(type)
        if (isMounted) {
          setItems(data?.length ? data : MOCK_PROPERTIES.filter(p => p.type === type))
        }
      } catch (err) {
        if (isMounted) {
          setItems(MOCK_PROPERTIES.filter(p => p.type === type))
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    loadData()
    return () => { isMounted = false }
  }, [type])

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
            dispatch(setFilters({ 
              ...currentFilters, 
              type: type === 'all' ? '' : type 
            }))
            navigate(viewAllPath || '/search')
          }}
          className="flex items-center gap-1 text-sm font-semibold text-[#CA3433] hover:text-[#ac2d2c] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#CA3433]/20 rounded px-1"
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
  const dispatch = useDispatch()
  const { featured, fetchFeatured, loading } = useProperties()
  const currentFilters = useSelector((state) => state.properties?.filters || {})
  
  const items = featured?.length ? featured : MOCK_PROPERTIES.sort((a, b) => b.views - a.views).slice(0, 6)
  const fetchRef = useRef(fetchFeatured)

  useEffect(() => {
    fetchRef.current = fetchFeatured
  }, [fetchFeatured])

  useEffect(() => {
    fetchRef.current()
  }, [])

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Flame size={24} className="text-orange-500 animate-pulse" />
          <h2 className="font-display font-bold text-xl text-gray-900">Most Popular</h2>
        </div>
        <Link 
          to="/search" 
          onClick={() => dispatch(setFilters({ ...currentFilters, type: '' }))}
          className="flex items-center gap-1 text-sm font-semibold text-[#CA3433] hover:text-[#ac2d2c] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#CA3433]/20 rounded px-1"
        >
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