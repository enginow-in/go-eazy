import React from 'react'
import { MapPin, Wifi, Car, Shield, Zap, Star, X } from 'lucide-react'

export const PropertyComparisonTable = ({ properties, onRemoveProperty, onClearAll }) => {
  if (!properties || properties.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star size={28} className="text-gray-300" />
        </div>
        <h3 className="font-bold text-gray-800 mb-1">No Properties to Compare</h3>
        <p className="text-sm text-gray-500">Add properties to your comparison from search results.</p>
      </div>
    )
  }

  const getAmenityIcon = (amenity) => {
    const icons = {
      'WiFi': <Wifi size={16} />,
      'Parking': <Car size={16} />,
      'Security': <Shield size={16} />,
      'Power Backup': <Zap size={16} />
    }
    return icons[amenity] || <span className="w-4 h-4 bg-gray-300 rounded-full"></span>
  }

  const compareFields = [
    { key: 'rent', label: 'Rent', format: (val) => `₹${val?.toLocaleString()}` },
    { key: 'property_type', label: 'Type', format: (val) => val },
    { key: 'city', label: 'Location', format: (val) => val },
    { key: 'area', label: 'Area', format: (val) => val },
    { key: 'rating', label: 'Rating', format: (val) => val ? `${val}/5` : 'Not rated' },
    { key: 'amenities', label: 'Amenities', format: (val) => val?.length || 0 }
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Property Comparison</h3>
        <button
          onClick={onClearAll}
          className="text-sm text-red-600 hover:underline font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <td className="p-4 font-medium text-gray-600 w-32">Property</td>
              {properties.map((property, index) => (
                <td key={property.id} className="p-4 relative min-w-64">
                  <button
                    onClick={() => onRemoveProperty(property.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <div className="pr-8">
                    <img 
                      src={property.images?.[0] || '/placeholder-property.jpg'} 
                      alt={property.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{property.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={12} />
                      <span>{property.area}, {property.city}</span>
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareFields.map((field) => (
              <tr key={field.key} className="border-b border-gray-100">
                <td className="p-4 font-medium text-gray-700 bg-gray-50">{field.label}</td>
                {properties.map((property) => (
                  <td key={property.id} className="p-4">
                    {field.key === 'amenities' ? (
                      <div className="flex flex-wrap gap-2">
                        {property.amenities?.slice(0, 3).map((amenity, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </div>
                        ))}
                        {property.amenities?.length > 3 && (
                          <span className="text-xs text-gray-500">+{property.amenities.length - 3} more</span>
                        )}
                      </div>
                    ) : field.key === 'rent' ? (
                      <span className="text-lg font-bold text-[#CA3433]">
                        {field.format(property[field.key])}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-700">
                        {field.format(property[field.key]) || 'N/A'}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile responsive cards for smaller screens */}
      <div className="md:hidden p-4 space-y-4">
        {properties.map((property, index) => (
          <div key={property.id} className="border border-gray-200 rounded-lg p-4 relative">
            <button
              onClick={() => onRemoveProperty(property.id)}
              className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
            >
              <X size={14} />
            </button>
            
            <div className="flex items-start gap-3 pr-8">
              <img 
                src={property.images?.[0] || '/placeholder-property.jpg'} 
                alt={property.title}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm mb-1 truncate">{property.title}</h4>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <MapPin size={12} />
                  <span>{property.area}, {property.city}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div><span className="font-medium">Rent:</span> ₹{property.rent?.toLocaleString()}</div>
                  <div><span className="font-medium">Type:</span> {property.property_type}</div>
                  <div><span className="font-medium">Rating:</span> {property.rating ? `${property.rating}/5` : 'Not rated'}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}