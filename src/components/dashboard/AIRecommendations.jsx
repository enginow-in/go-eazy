import React, { useState, useEffect } from 'react'
import { BrainCircuit, MapPin, Heart, Eye } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PropertyCard } from '../property/PropertyCard'

export const AIRecommendations = () => {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadRecommendations()
    }
  }, [user])

  const loadRecommendations = async () => {
    try {
      // Get user preferences from searches and favorites
      const [favoritesRes, searchRes] = await Promise.all([
        supabase
          .from('favorites')
          .select('property:properties(city, property_type, budget)')
          .eq('user_id', user.id)
          .limit(10),
        supabase
          .from('search_history')
          .select('location, property_type, budget')
          .eq('user_id', user.id)
          .limit(20)
      ])

      // Extract preferences
      const cities = [...new Set([
        ...favoritesRes.data?.map(f => f.property?.city).filter(Boolean) || [],
        ...searchRes.data?.map(s => s.location).filter(Boolean) || []
      ])]

      const propertyTypes = [...new Set([
        ...favoritesRes.data?.map(f => f.property?.property_type).filter(Boolean) || [],
        ...searchRes.data?.map(s => s.property_type).filter(Boolean) || []
      ])]

      // Build recommendation query
      let query = supabase
        .from('properties')
        .select('*')
        .neq('user_id', user.id) // Don't recommend user's own properties

      // Filter by user preferences
      if (cities.length > 0) {
        query = query.in('city', cities)
      }
      if (propertyTypes.length > 0) {
        query = query.in('property_type', propertyTypes)
      }

      const { data, error } = await query
        .order('views', { ascending: false })
        .limit(6)

      if (error) throw error

      // Calculate match percentage based on preferences
      const recommendationsWithMatch = data?.map(property => {
        let matchScore = 50 // Base score
        
        if (cities.includes(property.city)) matchScore += 20
        if (propertyTypes.includes(property.property_type)) matchScore += 15
        
        // Boost score based on popularity
        if (property.views > 100) matchScore += 10
        if (property.rating > 4) matchScore += 5
        
        return {
          ...property,
          matchPercentage: Math.min(matchScore, 95) // Cap at 95%
        }
      }) || []

      setRecommendations(recommendationsWithMatch)
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <BrainCircuit size={28} className="text-gray-300" />
        </div>
        <h3 className="font-bold text-gray-800 mb-1">Building Your Recommendations</h3>
        <p className="text-sm text-gray-500 mb-4">
          Start browsing and saving properties to get personalized recommendations.
        </p>
        <a 
          href="/search"
          className="inline-block bg-[#CA3433] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
        >
          Explore Properties
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recommendations.map((property) => (
        <div key={property.id} className="relative">
          <PropertyCard property={property} />
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {property.matchPercentage}% Match
          </div>
        </div>
      ))}
    </div>
  )
}