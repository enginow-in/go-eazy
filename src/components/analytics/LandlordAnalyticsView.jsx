import React, { useState } from 'react'
import {
  TrendingUp, Download, Printer, Sparkles, Filter,
  Eye, Lock, Calendar, CheckCircle2, ChevronRight, Zap
} from 'lucide-react'
import { useAdvancedAnalytics } from '../../hooks/useAdvancedAnalytics'
import { HeatmapVisualizer } from './HeatmapVisualizer'
import { Button } from '../ui/Button'

export const LandlordAnalyticsView = ({ properties = [] }) => {
  const {
    timeframe,
    setTimeframe,
    getLandlordFunnel,
    getHeatmapData,
    getListingPredictor,
    exportLandlordReportCSV,
    triggerPDFExport
  } = useAdvancedAnalytics()

  const [selectedPropertyId, setSelectedPropertyId] = useState('')

  const activeProp = properties.find(p => p.id === selectedPropertyId)
  const funnel = getLandlordFunnel(selectedPropertyId ? [activeProp] : properties)
  const heatmap = getHeatmapData(selectedPropertyId)
  const predictor = getListingPredictor(activeProp?.city || 'Dehradun')

  // Timeline view simulation points
  const timelinePoints = [
    { day: 'Mon', views: 42, unlocks: 8 },
    { day: 'Tue', views: 58, unlocks: 12 },
    { day: 'Wed', views: 64, unlocks: 15 },
    { day: 'Thu', views: 78, unlocks: 19 },
    { day: 'Fri', views: 95, unlocks: 24 },
    { day: 'Sat', views: 130, unlocks: 34 },
    { day: 'Sun', views: 165, unlocks: 42 }
  ]

  const maxViews = Math.max(...timelinePoints.map(t => t.views))

  return (
    <div className="space-y-8 text-gray-900 animate-in fade-in duration-300">
      
      {/* Top Header & Actions Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#CA3433] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              GoEazy Analytics Plus™
            </span>
            <span className="text-xs font-bold text-gray-400">• Portfolio Telemetry</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 font-display">Landlord Performance Insights</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Filter */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            {['7d', '30d', '90d', 'all'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                  timeframe === tf ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <Button
            onClick={() => exportLandlordReportCSV(properties)}
            variant="secondary"
            className="flex items-center gap-1.5 text-xs font-bold py-2.5 px-3.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200"
          >
            <Download size={14} /> Export CSV
          </Button>

          {/* Export PDF Button */}
          <Button
            onClick={() => triggerPDFExport('GoEazy Landlord Analytics')}
            variant="secondary"
            className="flex items-center gap-1.5 text-xs font-bold py-2.5 px-3.5 bg-gray-900 hover:bg-black text-white border-none"
          >
            <Printer size={14} /> Print PDF
          </Button>
        </div>
      </div>

      {/* Property Filter Dropdown */}
      {properties.length > 0 && (
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <Filter size={16} className="text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter Property:</span>
          <select
            value={selectedPropertyId}
            onChange={e => setSelectedPropertyId(e.target.value)}
            className="flex-1 max-w-xs h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
          >
            <option value="">All Properties ({properties.length} Total)</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.title} ({p.city})</option>
            ))}
          </select>
        </div>
      )}

      {/* ── 1. INQUIRY TO LEASE CONVERSION FUNNEL ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-gray-900 font-display">Inquiry → Conversion Funnel</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tracks how views convert into contact unlocks, site visits, and signed leases
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Conversion</p>
            <p className="text-2xl font-black text-emerald-600">{funnel.overallConversion}%</p>
          </div>
        </div>

        {/* Funnel Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {funnel.steps.map((step, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between relative group">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Step {idx + 1}</span>
                <h4 className="text-sm font-bold text-gray-900 mt-0.5">{step.name}</h4>
                <p className="text-2xl font-black text-gray-900 mt-2">{step.count.toLocaleString()}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">{step.conversion}% Rate</span>
                {idx > 0 && <span className="text-red-500 font-bold text-[11px]">-{step.dropoff}% drop</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. VIEW HISTORY TIMELINE & AI PREDICTIVE INSIGHT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* View History Timeline Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
                <TrendingUp size={20} className="text-[#CA3433]" /> View History Timeline (7-Day Peak)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Daily renter traffic & inquiry unlocking trends</p>
            </div>
          </div>

          {/* Bar Chart Simulation */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-gray-100">
            {timelinePoints.map((pt, i) => {
              const heightPct = Math.round((pt.views / maxViews) * 100)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded transition-opacity">
                    {pt.views} v
                  </div>
                  <div className="w-full bg-red-50 rounded-t-lg relative overflow-hidden flex items-end" style={{ height: `${heightPct}%` }}>
                    <div className="w-full bg-gradient-to-t from-[#CA3433] to-[#E63946] rounded-t-lg transition-all duration-500 group-hover:brightness-110" style={{ height: '100%' }} />
                  </div>
                  <span className="text-xs font-bold text-gray-600">{pt.day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Predictive Listing Time Recommendation (1 Col) */}
        <div className="lg:col-span-1 bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles size={120} />
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">
              <Sparkles size={16} /> AI Predictive Intelligence
            </div>
            <h3 className="text-xl font-black font-display mb-2">Optimal Listing Time</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              {predictor.reasoning}
            </p>

            <div className="space-y-2 bg-white/10 p-3.5 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Best Posting Day:</span>
                <span className="font-extrabold text-amber-300">{predictor.bestDay}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Window:</span>
                <span className="font-extrabold text-white">{predictor.bestTimeWindow}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Expected Impact:</span>
                <span className="font-extrabold text-green-400">{predictor.expectedMultiplier}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-gray-400 font-medium">
            * Data model updated live from Uttarakhand student search queries.
          </div>
        </div>

      </div>

      {/* ── 3. FEATURE CLICK HEATMAP ── */}
      <HeatmapVisualizer heatmapData={heatmap} />

    </div>
  )
}
