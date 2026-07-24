import React from 'react'
import { Flame, Eye, MousePointer } from 'lucide-react'

export const HeatmapVisualizer = ({ heatmapData = [] }) => {
  if (!heatmapData || heatmapData.length === 0) return null

  const getHeatColor = (percentage) => {
    if (percentage >= 35) return 'from-red-500 to-amber-500 text-white shadow-red-500/20'
    if (percentage >= 20) return 'from-amber-400 to-yellow-500 text-gray-900 shadow-amber-500/20'
    if (percentage >= 10) return 'from-blue-400 to-indigo-500 text-white shadow-blue-500/20'
    return 'from-slate-200 to-slate-300 text-slate-700'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
            <Flame className="text-red-500" size={20} /> Feature Engagement Heatmap
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Visual breakdown of tenant clicks & engagement intensity across property features
          </p>
        </div>
        <span className="text-xs font-bold text-[#CA3433] bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
          Live Telemetry Active
        </span>
      </div>

      {/* Heatmap Grid Bars */}
      <div className="space-y-4">
        {heatmapData.map((item, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-700 flex items-center gap-1.5">
                <MousePointer size={13} className="text-gray-400" />
                {item.label}
              </span>
              <span className="text-gray-900 font-mono">
                {item.heatPercentage}% <span className="text-gray-400 text-[10px]">({item.hitCount} interactions)</span>
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getHeatColor(item.heatPercentage)} transition-all duration-500 shadow-sm`}
                style={{ width: `${Math.max(item.heatPercentage, 6)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
