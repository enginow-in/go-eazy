import React, { useState, useMemo, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'
import { PropertyCard } from './PropertyCard'
import { cn } from '../../utils/helpers'

export const RecommendedSection = ({ viewMode = 'grid' }) => {
  const { getRecommendedProperties, loading } = useProperties()
  const { profile } = useAuth()
  const onboardingData = profile?.onboarding_data
  const [recommendationVersion, setRecommendationVersion] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handleReset = () => {
      setDismissed(true)
      setRecommendationVersion(version => version + 1)
    }
    const handleUpdated = () => {
      setDismissed(false)
      setRecommendationVersion(version => version + 1)
    }

    window.addEventListener('goeazy_quiz_reset', handleReset)
    window.addEventListener('goeazy_recommendations_updated', handleUpdated)
    return () => {
      window.removeEventListener('goeazy_quiz_reset', handleReset)
      window.removeEventListener('goeazy_recommendations_updated', handleUpdated)
    }
  }, [])

  // getRecommendedProperties() randomizes its sort order on every call, so it
  // must only be invoked when its actual inputs (listings/profile) change —
  // not on unrelated re-renders like a viewMode toggle. useMemo already gives
  // us that for free, since getRecommendedProperties is itself memoized on
  // [listings, profile]. No effect or ref is needed to "lock" the result.
  const recommendations = useMemo(
    () => {
      void recommendationVersion
      return loading ? [] : getRecommendedProperties()
    },
    [loading, getRecommendedProperties, recommendationVersion]
  )

  // Hide immediately when the user resets, without waiting for a new quiz
  // submission to change onboardingData. This is React's documented pattern
  // for adjusting state during render in response to a prop change, rather
  // than doing it in an effect: https://react.dev/learn/you-might-not-need-an-effect
  const [prevOnboardingData, setPrevOnboardingData] = useState(onboardingData)
  if (prevOnboardingData !== onboardingData) {
    setPrevOnboardingData(onboardingData)
    setDismissed(false)
  }

  if (dismissed || !recommendations.length) return null

  const handleResetQuiz = () => {
    setDismissed(true)
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
