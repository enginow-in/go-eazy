import React from 'react'
import { GitCompareArrows, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { clearComparison, removeFromCompare } from '../../store/propertySlice'

export const CompareActionBar = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const properties = useSelector(state => state.property?.comparisonList || [])

  if (!properties.length) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <GitCompareArrows className="shrink-0 text-[#CA3433]" size={20} />
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {properties.map(property => (
              <span key={property.id} className="inline-flex max-w-40 shrink-0 items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-700">
                <span className="truncate">{property.title}</span>
                <button type="button" onClick={() => dispatch(removeFromCompare(property.id))} aria-label={`Remove ${property.title}`}>
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => dispatch(clearComparison())} className="text-xs font-bold text-gray-500 hover:text-gray-900">Clear</button>
          <button type="button" onClick={() => navigate('/compare')} className="rounded-xl bg-[#CA3433] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#a92b2a]">Compare Now</button>
        </div>
      </div>
    </div>
  )
}
