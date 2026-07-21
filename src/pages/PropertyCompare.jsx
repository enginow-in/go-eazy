import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowLeft, X, Star, Check, Minus, Home, Building, Tent, Eye } from 'lucide-react'
import { clearCompare, toggleCompare } from '../store/propertySlice'
import { MOCK_PROPERTIES } from '../utils/constants'
import { formatPrice, AMENITY_ICONS } from '../utils/helpers'
import { Badge } from '../components/ui/Badge'

export const PropertyCompare = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { compareIds } = useSelector(s => s.property)
  const properties = MOCK_PROPERTIES.filter(p => compareIds.includes(p.id))

  if (properties.length === 0) {
    return (
      <div className="pt-8 pb-20 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <Eye size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No properties to compare</h2>
            <p className="text-gray-500 mb-6">Add properties from the search page to compare them side by side.</p>
            <button onClick={() => navigate('/search')} className="px-6 py-2.5 bg-[#CA3433] text-white rounded-full font-bold text-sm hover:bg-[#ac2d2c] transition-colors">
              Browse Properties
            </button>
          </div>
        </div>
      </div>
    )
  }

  const rows = [
    { label: 'Price', key: 'price', render: (p) => <span className="font-bold text-lg text-[#CA3433]">{formatPrice(p.price)}<span className="text-xs font-normal text-gray-400">/mo</span></span> },
    { label: 'Type', key: 'type', render: (p) => <Badge variant={p.type === 'Room' ? 'brand' : p.type === 'Flat' ? 'success' : p.type === 'Hostel' ? 'warning' : 'purple'}>{p.type}</Badge> },
    { label: 'Bedrooms', key: 'bedrooms', render: (p) => <span className="font-semibold">{p.bedrooms || '—'} BHK</span> },
    { label: 'Furnishing', key: 'furnishing_type', render: (p) => {
      const map = { full: 'Fully Furnished', semi: 'Semi Furnished', none: 'Unfurnished' }
      return <span className="font-semibold text-sm capitalize">{map[p.furnishing_type] || p.furnishing_type || '—'}</span>
    }},
    { label: 'City', key: 'city', render: (p) => <span className="font-semibold">{p.city}</span> },
    { label: 'Area', key: 'area', render: (p) => <span className="text-sm text-gray-600">{p.area}</span> },
    { label: 'Availability', key: 'availability', render: (p) => p.availability ? <span className="text-green-600 font-semibold flex items-center gap-1 justify-center"><Check size={14} /> Available</span> : <span className="text-red-500 font-semibold">Rented</span> },
    { label: 'Pet Friendly', key: 'pet_friendly', render: (p) => p.pet_friendly ? <span className="text-green-600"><Check size={16} /></span> : <span className="text-gray-300"><Minus size={16} /></span> },
    { label: 'Balcony', key: 'balcony', render: (p) => p.balcony ? <span className="text-green-600"><Check size={16} /></span> : <span className="text-gray-300"><Minus size={16} /></span> },
    { label: 'Rating', key: 'rating', render: (p) => {
      const r = p.rating || '0.0'
      return <div className="flex items-center gap-1 justify-center"><span className="font-bold">{r}</span><Star size={12} className="text-amber-400 fill-amber-400" /></div>
    }},
    { label: 'Views', key: 'views', render: (p) => <span className="font-semibold">{p.views}</span> },
  ]

  return (
    <div className="pt-8 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={() => { dispatch(clearCompare()); navigate('/search') }}
            className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors"
          >
            Clear All
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 font-display mb-8">Compare Properties</h1>

        {/* Property Headers */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `180px repeat(${properties.length}, 1fr)` }}>
          {/* Empty header cell */}
          <div />

          {properties.map(p => (
            <div key={p.id} className="text-center">
              <div className="relative">
                <img src={p.images?.[0]} alt={p.title} className="w-full aspect-[4/3] object-cover rounded-xl mb-3" />
                <button
                  onClick={() => dispatch(toggleCompare(p.id))}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                >
                  <X size={14} className="text-gray-600" />
                </button>
              </div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-2">{p.title}</h3>
              <button
                onClick={() => navigate(`/property/${p.id}`)}
                className="text-xs font-bold text-[#CA3433] hover:underline"
              >
                View Details
              </button>
            </div>
          ))}

          {/* Comparison Rows */}
          {rows.map(row => (
            <React.Fragment key={row.key}>
              <div className="text-sm font-bold text-gray-500 py-4 border-t border-gray-100 flex items-center">
                {row.label}
              </div>
              {properties.map(p => (
                <div key={`${p.id}-${row.key}`} className="py-4 border-t border-gray-100 flex items-center justify-center text-center">
                  {row.render(p)}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Amenities */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Amenities</h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: `180px repeat(${properties.length}, 1fr)` }}>
            <div />
            {properties.map((p, idx) => (
              <div key={idx} className="space-y-2">
                {(p.amenities || []).map(a => {
                  const Icon = AMENITY_ICONS[a]
                  return (
                    <div key={a} className="flex items-center gap-2 text-sm">
                      {Icon && <Icon size={14} className="text-gray-500 shrink-0" />}
                      <span className="capitalize">{a}</span>
                    </div>
                  )
                })}
                {(!p.amenities || p.amenities.length === 0) && (
                  <span className="text-sm text-gray-400">No amenities listed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
