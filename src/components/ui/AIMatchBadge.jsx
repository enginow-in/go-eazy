import React from 'react'
import { Sparkles } from 'lucide-react'
import { calculateAIMatchScore } from '../../utils/aiSearchParser'

export const AIMatchBadge = ({ property, profile, filters, score, compact = false }) => {
  const matchScore = score || calculateAIMatchScore(property, profile, filters)

  return (
    <div className={`inline-flex items-center gap-1 font-extrabold rounded-full shadow-sm text-white bg-gradient-to-r from-[#CA3433] via-rose-600 to-amber-500 border border-white/40 animate-pulse ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      <Sparkles size={compact ? 10 : 12} className="shrink-0 text-amber-200" />
      <span>{matchScore}% AI Match</span>
    </div>
  )
}
