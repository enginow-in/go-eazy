import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { removeFromCompare, clearCompare } from '../store/propertySlice'
import { X, ArrowLeft, Check, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const PropertyCompare = () => {
  const { comparisonList } = useSelector(s => s.property)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Extract all unique amenities across compared properties
  const allAmenities = React.useMemo(() => {
    const amenitiesSet = new Set()
    comparisonList.forEach(p => {
      if (Array.isArray(p.amenities)) {
        p.amenities.forEach(a => {
          // Sometimes amenities are objects, sometimes strings
          const name = typeof a === 'object' ? a.name : a
          if (name) amenitiesSet.add(name)
        })
      }
    })
    return Array.from(amenitiesSet)
  }, [comparisonList])

  if (!comparisonList || comparisonList.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mb-6">
          <X size={48} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Nothing to Compare</h2>
        <p className="text-gray-500 mb-8 max-w-md">You haven't selected any properties to compare. Go back to the search page and select up to 3 properties.</p>
        <button
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Search
        </button>
      </div>
    )
  }

  const formatPrice = (p) => {
    if (!p) return '0'
    return Number(p).toLocaleString('en-IN')
  }

  const hasAmenity = (property, amenityName) => {
    if (!Array.isArray(property.amenities)) return false
    return property.amenities.some(a => {
      const name = typeof a === 'object' ? a.name : a
      return name === amenityName
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-black text-gray-900">Compare Properties</h1>
        </div>
        <button 
          onClick={() => dispatch(clearCompare())}
          className="text-red-500 hover:text-red-700 font-bold px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="overflow-x-auto pb-8">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="p-4 border-b-2 border-gray-100 w-1/4 bg-white sticky left-0 z-10">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-sm">Features</span>
              </th>
              {comparisonList.map(property => (
                <th key={property.id} className="p-4 border-b-2 border-gray-100 w-1/4 align-top relative">
                  <button 
                    onClick={() => dispatch(removeFromCompare(property.id))}
                    className="absolute top-2 right-2 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-all shadow-sm z-10"
                  >
                    <X size={16} />
                  </button>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-gray-50 shadow-sm">
                    <img src={property.images?.[0]} alt={property.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-1">
                    {t(`property.types.${property.type}`) || property.type || 'PROPERTY'}
                  </div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 line-clamp-2">{property.title}</h3>
                  <button 
                    onClick={() => navigate(`/property/${property.id}`)}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Price Row */}
            <tr className="hover:bg-gray-50/50">
              <td className="p-4 bg-white sticky left-0 font-bold text-gray-900 z-10">Price</td>
              {comparisonList.map(property => (
                <td key={property.id} className="p-4">
                  <span className="text-xl font-black text-brand-600">₹{formatPrice(property.price)}</span>
                </td>
              ))}
            </tr>
            
            {/* Rating Row */}
            <tr className="hover:bg-gray-50/50">
              <td className="p-4 bg-white sticky left-0 font-bold text-gray-900 z-10">Rating</td>
              {comparisonList.map(property => (
                <td key={property.id} className="p-4">
                  <span className="font-bold text-gray-900">{property.rating || '0.0'}</span> <span className="text-gray-400 text-sm">/ 5</span>
                </td>
              ))}
            </tr>

            {/* Bedrooms Row */}
            <tr className="hover:bg-gray-50/50">
              <td className="p-4 bg-white sticky left-0 font-bold text-gray-900 z-10">Bedrooms</td>
              {comparisonList.map(property => (
                <td key={property.id} className="p-4 font-medium text-gray-600">
                  {property.bedrooms || '-'}
                </td>
              ))}
            </tr>

            {/* Bathrooms Row */}
            <tr className="hover:bg-gray-50/50">
              <td className="p-4 bg-white sticky left-0 font-bold text-gray-900 z-10">Bathrooms</td>
              {comparisonList.map(property => (
                <td key={property.id} className="p-4 font-medium text-gray-600">
                  {property.bathrooms || '-'}
                </td>
              ))}
            </tr>

            {/* Area Row */}
            <tr className="hover:bg-gray-50/50">
              <td className="p-4 bg-white sticky left-0 font-bold text-gray-900 z-10">Area Size</td>
              {comparisonList.map(property => (
                <td key={property.id} className="p-4 font-medium text-gray-600">
                  {property.area_size ? `${property.area_size} sqft` : '-'}
                </td>
              ))}
            </tr>

            {/* Amenities Section */}
            <tr>
              <td colSpan={comparisonList.length + 1} className="p-4 bg-gray-50 font-black text-gray-900 uppercase tracking-widest text-xs">
                Amenities
              </td>
            </tr>
            {allAmenities.map((amenity, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50">
                <td className="p-4 bg-white sticky left-0 font-bold text-gray-700 z-10">{amenity}</td>
                {comparisonList.map(property => (
                  <td key={property.id} className="p-4 text-center">
                    {hasAmenity(property, amenity) ? (
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 mx-auto">
                        <Check size={16} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mx-auto">
                        <Minus size={16} />
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
