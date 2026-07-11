import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { clearCompare, removeFromCompare } from '../../store/propertySlice'
import { X, Scale, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const CompareActionBar = () => {
  const { comparisonList } = useSelector(s => s.property)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (!comparisonList || comparisonList.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none flex justify-center">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 sm:p-4 w-full max-w-3xl flex items-center justify-between pointer-events-auto transform transition-transform duration-300 translate-y-0">
        
        <div className="flex items-center gap-3 sm:gap-6 flex-1 overflow-x-auto no-scrollbar">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Compare</span>
            <span className="text-sm font-black text-brand-600">{comparisonList.length} / 3 Selected</span>
          </div>

          <div className="flex items-center gap-2">
            {comparisonList.map(property => (
              <div key={property.id} className="relative group w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                <img src={property.images?.[0]} alt={property.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => dispatch(removeFromCompare(property.id))}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            ))}
            {[...Array(3 - comparisonList.length)].map((_, i) => (
              <div key={`empty-${i}`} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0 bg-gray-50">
                <Scale size={16} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-4 flex-shrink-0">
          <button
            onClick={() => dispatch(clearCompare())}
            className="hidden sm:flex text-sm font-bold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => navigate('/compare')}
            disabled={comparisonList.length < 2}
            className="flex items-center gap-2 bg-[#CA3433] hover:bg-brand-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black transition-colors"
          >
            <span className="hidden sm:inline">Compare Now</span>
            <span className="sm:hidden">Compare</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
