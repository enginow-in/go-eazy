import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check, Minus, Sparkles, Building, MapPin, IndianRupee, Star, MessageSquare, Calendar, ExternalLink, Trash2 } from 'lucide-react'
import { useCompare } from '../../hooks/useCompare'
import { formatPriceShort } from '../../utils/helpers'

const ALL_AMENITIES = [
  'WiFi', 'Parking', 'AC', 'Power Backup', 'Food', 'Security', 'Gym', 'TV', 'Laundry', 'Furnished'
]

export const CompareModal = () => {
  const navigate = useNavigate()
  const { isCompareModalOpen, comparedProperties, removeFromCompare, clearCompare, closeCompareModal } = useCompare()

  if (!isCompareModalOpen || comparedProperties.length === 0) return null

  // Find lowest rent property for Best Price highlight tag
  const minPrice = Math.min(...comparedProperties.map(p => Number(p.price || Infinity)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 print:hidden">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-900 via-gray-800 to-[#CA3433] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#CA3433] flex items-center justify-center shadow-sm">
              <Sparkles size={20} className="text-amber-200" />
            </div>
            <div>
              <h3 className="text-lg font-black font-display leading-tight">Side-by-Side Property Matrix</h3>
              <p className="text-xs text-gray-200">Evaluating {comparedProperties.length} selected listings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearCompare}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={14} /> Clear All
            </button>
            <button
              onClick={closeCompareModal}
              className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Comparison Matrix Table (Scrollable) */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          <table className="w-full border-collapse min-w-[650px]">
            <thead>
              <tr>
                <th className="w-48 text-left p-3 text-xs font-black uppercase tracking-wider text-gray-400 border-b border-gray-200 bg-gray-50/50 rounded-tl-2xl">
                  Feature / Specs
                </th>
                {comparedProperties.map((p) => {
                  const isBestValue = Number(p.price) === minPrice && comparedProperties.length > 1
                  return (
                    <th key={p.id} className="p-3 text-left border-b border-gray-200 bg-gray-50/50 min-w-[200px] relative">
                      <div className="space-y-2">
                        {/* Remove button */}
                        <button
                          onClick={() => removeFromCompare(p.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Remove from comparison"
                        >
                          <X size={16} />
                        </button>

                        <div className="relative aspect-[16/10] rounded-xl overflow-hidden shadow-sm bg-gray-100 mt-2">
                          <img src={p.images?.[0] || ''} alt={p.title} className="w-full h-full object-cover" />
                          {isBestValue && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full shadow-md uppercase tracking-wider">
                              Best Value
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-black uppercase text-[#CA3433] tracking-widest">{p.type}</span>
                          <h4 className="font-bold text-sm text-gray-900 line-clamp-1 hover:text-[#CA3433] cursor-pointer transition-colors" onClick={() => { closeCompareModal(); navigate(`/property/${p.id}`) }}>
                            {p.title}
                          </h4>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                            <MapPin size={12} className="text-gray-400 shrink-0" /> {p.city || 'Dehradun'}
                          </p>
                        </div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs">
              
              {/* Row 1: Rent Price */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-3 font-bold text-gray-700 bg-gray-50/30 flex items-center gap-2">
                  <IndianRupee size={14} className="text-[#CA3433]" /> Monthly Rent
                </td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-3 font-black text-base text-gray-900">
                    ₹{Number(p.price || 0).toLocaleString('en-IN')}<span className="text-xs font-normal text-gray-500">/mo</span>
                  </td>
                ))}
              </tr>

              {/* Row 2: Security Deposit */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-3 font-bold text-gray-700 bg-gray-50/30">
                  Security Deposit
                </td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-3 font-semibold text-gray-700">
                    ₹{Number(p.deposit || p.price * 2 || 0).toLocaleString('en-IN')}
                  </td>
                ))}
              </tr>

              {/* Row 3: Bedrooms & Capacity */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-3 font-bold text-gray-700 bg-gray-50/30">
                  Bedrooms / Layout
                </td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-3 font-semibold text-gray-800">
                    {p.bedrooms || 1} BHK / Room
                  </td>
                ))}
              </tr>

              {/* Row 4: Furnishing Status */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-3 font-bold text-gray-700 bg-gray-50/30">
                  Furnishing Status
                </td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-3 font-semibold text-gray-800">
                    {p.furnishing || 'Semi-Furnished'}
                  </td>
                ))}
              </tr>

              {/* Row 5: Rating & Reviews */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-3 font-bold text-gray-700 bg-gray-50/30">
                  Rating & Rating Count
                </td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-3">
                    <div className="flex items-center gap-1 font-extrabold text-gray-900">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span>{p.rating || '4.5'}</span>
                      <span className="text-[10px] text-gray-400 font-normal">({p.reviews_count || 12} reviews)</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Section Header: Amenities Breakdown */}
              <tr>
                <td colSpan={comparedProperties.length + 1} className="p-3 bg-gray-100/70 font-black text-gray-900 uppercase tracking-wider text-[10px]">
                  Amenities & Facilities Matrix
                </td>
              </tr>

              {/* Amenities Grid Rows */}
              {ALL_AMENITIES.map((amenity) => (
                <tr key={amenity} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 font-bold text-gray-600 bg-gray-50/30">
                    {amenity}
                  </td>
                  {comparedProperties.map((p) => {
                    const hasAmenity = Array.isArray(p.amenities) && p.amenities.includes(amenity)
                    return (
                      <td key={p.id} className="p-3">
                        {hasAmenity ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <Check size={14} /> Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-gray-400">
                            <Minus size={14} /> —
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Row: Quick Action Buttons */}
              <tr>
                <td className="p-3 font-bold text-gray-700 bg-gray-50/30">
                  Actions
                </td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-3 space-y-2">
                    <button
                      onClick={() => { closeCompareModal(); navigate(`/property/${p.id}`) }}
                      className="w-full py-2 bg-[#CA3433] hover:bg-[#ac2d2c] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>View Details</span> <ExternalLink size={12} />
                    </button>
                    <button
                      onClick={() => { closeCompareModal(); navigate(`/messages`) }}
                      className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <MessageSquare size={12} /> Chat Owner
                    </button>
                  </td>
                ))}
              </tr>

            </tbody>
          </table>

        </div>

      </div>
    </div>
  )
}
