import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Clock, School, Building, Train } from 'lucide-react'
import { PropertyCard } from '../property/PropertyCard'
import { supabase } from '../../lib/supabase'

export const NearbyProperties = () => {
  const [nearbyProperties, setNearbyProperties] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentLocation()
  }, [])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          loadNearbyProperties(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.error('Error getting location:', error)
          // Fallback to a default location (Delhi center)
          loadNearbyProperties(28.6139, 77.2090)
        }
      )
    } else {
      // Geolocation not supported, use default
      loadNearbyProperties(28.6139, 77.2090)
    }
  }

  const loadNearbyProperties = async (lat, lng) => {
    try {
      // For now, just get properties and mock the distance calculation
      // In a real app, you'd use PostGIS or similar for actual distance calculations
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .limit(6)

      if (error) throw error

      // Mock distance calculation - in reality you'd use proper geographic queries
      const propertiesWithDistance = data?.map(property => ({
        ...property,
        distance: Math.round(Math.random() * 10 + 1), // Random 1-10 km
        travelTime: Math.round(Math.random() * 30 + 10), // Random 10-40 min
        nearbyAmenities: {
          schools: Math.floor(Math.random() * 5) + 1,
          hospitals: Math.floor(Math.random() * 3) + 1,
          metros: Math.floor(Math.random() * 2),
          busStops: Math.floor(Math.random() * 8) + 2
        }
      })) || []

      // Sort by distance
      propertiesWithDistance.sort((a, b) => a.distance - b.distance)
      
      setNearbyProperties(propertiesWithDistance)
    } catch (error) {
      console.error('Error loading nearby properties:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <Navigation size={16} className="text-blue-500" />
        <span>Showing properties near your location</span>
      </div>

      {nearbyProperties.map((property) => (
        <div key={property.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
              <img 
                src={property.images?.[0] || '/placeholder-property.jpg'} 
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 truncate">{property.title}</h4>
              <p className="text-sm text-gray-500 mb-2">{property.area}, {property.city}</p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {property.distance} km away
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {property.travelTime} min
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <School size={12} />
                  {property.nearbyAmenities.schools} schools
                </span>
                <span className="flex items-center gap-1">
                  <Building size={12} />
                  {property.nearbyAmenities.hospitals} hospitals
                </span>
                <span className="flex items-center gap-1">
                  <Train size={12} />
                  {property.nearbyAmenities.metros} metro
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">₹{property.rent?.toLocaleString()}</p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}