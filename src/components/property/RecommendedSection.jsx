import React, { useState, useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { PropertyCard } from './PropertyCard'
import { cn } from '../../utils/helpers'

export const RecommendedSection = ({ viewMode = 'grid' }) => {
  const { getRecommendedProperties, loading } = useProperties()
  const [recommendations, setRecommendations] = useState([])
  const isLocked = useRef(false)

  // Lock recommendations once — prevents re-shuffle flicker on every re-render
  useEffect(() => {
    if (!loading && !isLocked.current) {
      const recs = getRecommendedProperties()
      if (recs.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecommendations(recs)
        isLocked.current = true
      }
    }
  }, [loading, getRecommendedProperties])

  if (!recommendations.length) return null

  const handleResetQuiz = () => {
    isLocked.current = false
    setRecommendations([])
    window.dispatchEvent(new Event('goeazy_quiz_reset'))
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#CA3433]" />
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recommended for You</h2>
        </div>
        <button
          onClick={handleResetQuiz}
          className="text-xs font-bold text-[#CA3433] hover:underline px-3 py-1.5 rounded-lg border border-red-100 bg-red-50/30 transition-all active:scale-95"
        >
          Reset
        </button>
      </div>

      {/* Horizontal Scroll with peeking cards */}
      <div className="flex gap-3 sm:gap-6 xl:gap-8 overflow-x-auto pb-4 px-1 no-scrollbar -mx-1 snap-x snap-mandatory pt-2">
        {recommendations.map(p => (
          <div
            key={`rec-${p.id}`}
            className={cn(
              "flex-none ring-1 ring-[#CA3433]/10 rounded-2xl group snap-start transition-all duration-300",
              viewMode === 'list'
                ? "w-[88%]"
                : "w-[40%] sm:w-[25%] lg:w-[20%] xl:w-[16%]"
            )}
          >
            <PropertyCard
              property={p}
              layout={viewMode}
              condensed={true}
              badge={
                <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#CA3433] to-[#ff4d4d] text-white text-[7px] font-black rounded-full uppercase tracking-widest border border-white/20 shadow-md shadow-red-500/30">
                  <Sparkles size={8} className="fill-current" />
                  Match Found
                </div>
              }
            />
          </div>
        ))}
      </div>

      {/* Divider before All Results */}
      <div className="mt-2 pt-1 border-t border-gray-100">
        <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-[0.2em]">All Results</h3>
      </div>
    </div>
  )
}
