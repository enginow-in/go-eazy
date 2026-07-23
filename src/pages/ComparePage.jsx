import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layers, ArrowLeft, Plus, Sparkles, Building, Trash2 } from 'lucide-react'
import { useCompare } from '../hooks/useCompare'
import { CompareModal } from '../components/compare/CompareModal'

export const ComparePage = () => {
  const navigate = useNavigate()
  const { comparedProperties, clearCompare, openCompareModal } = useCompare()

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#CA3433] text-white text-[10px] font-bold uppercase tracking-widest">
                  GoEazy CompareHub™
                </span>
                <span className="text-xs text-gray-400 font-bold">
                  {comparedProperties.length} / 4 Selected
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-display mt-1">
                Property Comparison Hub
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {comparedProperties.length > 0 && (
              <button
                onClick={clearCompare}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} /> Clear Selection
              </button>
            )}

            <Link
              to="/search"
              className="px-5 py-2 bg-[#CA3433] hover:bg-[#ac2d2c] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Browse Properties to Add
            </Link>
          </div>
        </div>

        {/* Selected Properties Showcase or Empty State */}
        {comparedProperties.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4 shadow-sm max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-3xl bg-[#fff5f5] text-[#CA3433] flex items-center justify-center mx-auto shadow-sm">
              <Layers size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-display">No properties selected for comparison</h3>
              <p className="text-xs text-gray-500 mt-1">
                Click the <strong>"+ Compare"</strong> button on any property card while browsing to compare rent, deposits, and amenities side-by-side!
              </p>
            </div>
            <Link
              to="/search"
              className="inline-block px-6 py-3 bg-[#CA3433] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#ac2d2c] transition-colors"
            >
              Explore Listings
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Click "Launch Full Comparison Matrix" to view detailed side-by-side specs & amenities table
              </p>
              <button
                onClick={openCompareModal}
                className="px-6 py-3 bg-gradient-to-r from-gray-900 to-[#CA3433] text-white text-xs font-black rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} className="text-amber-200" /> Launch Full Comparison Matrix
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {comparedProperties.map((p) => (
                <div key={p.id} className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                  <img src={p.images?.[0] || ''} alt={p.title} className="w-full h-44 object-cover rounded-2xl" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#CA3433] tracking-widest">{p.type}</span>
                    <h3 className="font-bold text-base text-gray-900 line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-gray-500">{p.area}, {p.city}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Monthly Rent</span>
                      <span className="text-lg font-black text-gray-900">₹{Number(p.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/property/${p.id}`)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <CompareModal />
    </div>
  )
}
