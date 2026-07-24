import React from 'react'
import { X, ArrowRight, Layers, Trash2 } from 'lucide-react'
import { useCompare } from '../../hooks/useCompare'

export const CompareBar = () => {
  const { comparedProperties, removeFromCompare, clearCompare, openCompareModal } = useCompare()

  if (comparedProperties.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto bg-gray-900/95 backdrop-blur-md text-white rounded-3xl p-3 sm:px-5 sm:py-3.5 shadow-2xl border border-gray-800 flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300 print:hidden">
      
      {/* Count & Thumbnails */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-2xl bg-[#CA3433] text-white shrink-0 shadow-md">
          <Layers size={18} />
        </div>

        <div className="hidden sm:block">
          <h4 className="text-xs font-bold font-display leading-tight">Compare Properties</h4>
          <p className="text-[10px] text-gray-400 font-semibold">{comparedProperties.length} of 4 Selected</p>
        </div>

        <div className="flex items-center -space-x-2 overflow-hidden py-1">
          {comparedProperties.map((p) => (
            <div key={p.id} className="relative group shrink-0">
              <img
                src={p.images?.[0] || ''}
                alt={p.title}
                className="w-10 h-10 rounded-xl object-cover border-2 border-gray-900 shadow-md group-hover:opacity-60 transition-opacity"
              />
              <button
                onClick={() => removeFromCompare(p.id)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                title="Remove"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={clearCompare}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors text-xs font-bold cursor-pointer"
          title="Clear all"
        >
          <Trash2 size={16} />
        </button>

        <button
          onClick={openCompareModal}
          className="px-4 py-2 bg-[#CA3433] hover:bg-[#ac2d2c] text-white text-xs font-extrabold rounded-2xl shadow-md shadow-[#CA3433]/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <span>Compare Now</span>
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  )
}
