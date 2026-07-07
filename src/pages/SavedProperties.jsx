import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Heart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProperties } from '../hooks/useProperties'
import { PropertyCard } from '../components/property/PropertyCard'
import { supabase } from '../lib/supabase'
import { MOCK_PROPERTIES } from '../utils/constants'
import { Skeleton } from '../components/ui/Skeleton'

export const SavedProperties = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { favorites } = useProperties()
  const [favProps, setFavProps] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    if (user) {
      loadProperties()
    }
  }, [user, favorites]) // React to changes in favorites list

  const loadProperties = async () => {
    if (!user) return
    
    // Only set loading if we don't have any data yet
    if (favProps.length === 0) {
      setLoading(true)
    }

    try {
      if (favorites.length > 0) {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .in('id', favorites)
        
        if (error) throw error
        if (data) {
          // preserve order based on favorites array
          const ordered = favorites.map(id => data.find(p => p.id === id)).filter(Boolean)
          setFavProps(ordered)
        }
      } else {
        setFavProps([])
      }
    } catch (err) {
      console.error('Error loading saved properties:', err)
      setFavProps(MOCK_PROPERTIES.filter(p => favorites.includes(p.id)))
    } finally {
      setLoading(false)
    }
  }
const sortedProperties = [...favProps].sort((a, b) => {
  switch (sortBy) {
    case 'priceLow':
    return Number(a.price) - Number(b.price)

    case 'priceHigh':
    return Number(b.price) - Number(a.price)

    case 'oldest':
    return new Date(a.created_at) - new Date(b.created_at)

    case 'type':
    return a.type.localeCompare(b.type)

    case 'newest':
    default:
    return new Date(b.created_at) - new Date(a.created_at)
  }
})
const stats = {
  total: favProps.length,
  cheapest:
    favProps.length > 0
      ? Math.min(...favProps.map((p) => Number(p.price)))
      : 0,
  cities: [...new Set(favProps.map((p) => p.city))].length,
  types: [...new Set(favProps.map((p) => p.type))].length,
}
  return (
    <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation / Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
  <div>
    <h1 className="text-2xl font-black text-gray-900 font-display flex items-center gap-2">
      Saved Properties
      <Heart size={24} className="text-brand-500 fill-brand-500 animate-pulse" />
    </h1>
    <p className="text-sm font-medium text-gray-500">
      {favProps.length} listings saved to your collection
    </p>
  </div>
  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
  >
    <option value="newest">Newest</option>
    <option value="oldest">Oldest</option>
    <option value="priceLow">Price: Low → High</option>
    <option value="priceHigh">Price: High → Low</option>
    <option value="type">Property Type</option>
  </select>
</div>
        </div>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
    <p className="text-xs text-gray-500">Saved</p>
    <h3 className="text-2xl font-bold">{stats.total}</h3>
  </div>

  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
    <p className="text-xs text-gray-500">Cheapest</p>
    <h3 className="text-lg font-bold">
      ₹{stats.cheapest.toLocaleString()}
    </h3>
  </div>

  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
    <p className="text-xs text-gray-500">Cities</p>
    <h3 className="text-2xl font-bold">{stats.cities}</h3>
  </div>

  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
    <p className="text-xs text-gray-500">Types</p>
    <h3 className="text-2xl font-bold">{stats.types}</h3>
  </div>
</div>
        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-2 rounded-2xl border border-gray-100 flex gap-4">
                 <Skeleton className="w-32 h-32 sm:w-44 sm:h-44 rounded-xl flex-shrink-0" />
                 <div className="flex-1 py-2 space-y-3">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="mt-auto flex justify-between pt-4">
                       <Skeleton className="h-8 w-24" />
                       <Skeleton className="h-8 w-16" />
                    </div>
                 </div>
              </div>
            ))}
          </div>
        ) : favProps.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Heart size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No saved properties yet</h2>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">
              Start exploring listings and save your favorites to view them here later.
            </p>
            <button 
              onClick={() => navigate('/search')}
              className="bg-brand-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20"
            >
              Explore Listings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedProperties.map(p => (
              <PropertyCard key={p.id} property={p} layout="list" />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
