import React from 'react'
import { Clock, Star, ThumbsUp, CheckCircle, Zap, ShieldCheck } from 'lucide-react'
import { useAdvancedAnalytics } from '../../hooks/useAdvancedAnalytics'

export const ServiceProviderAnalyticsView = ({ services = [] }) => {
  const { getProviderMetrics } = useAdvancedAnalytics()
  const metrics = getProviderMetrics(services)

  return (
    <div className="space-y-6 text-gray-900 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-green-100 text-green-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
            Provider Performance Telemetry
          </span>
          <h2 className="text-2xl font-black text-gray-900 font-display mt-1">Service Analytics & Speed</h2>
        </div>

        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-green-600" />
          <span className="text-xs font-bold text-gray-700">{metrics.verifiedCount} / {metrics.totalListings} Listings Verified</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Response Speed</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{metrics.avgResponseMins} <span className="text-sm font-bold text-gray-500">mins</span></p>
          <p className="text-xs text-green-600 font-bold mt-1">⚡ Faster than 92% of providers</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Response Rate</span>
            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <ThumbsUp size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{metrics.responseRate}%</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Calculated over last 30 inquiries</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Rating</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star size={20} className="fill-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{metrics.customerSatisfaction} <span className="text-sm text-gray-400 font-normal">/ 5.0</span></p>
          <p className="text-xs text-emerald-600 font-bold mt-1">★ Top-Rated Badge Earned</p>
        </div>
      </div>

      {/* Customer Satisfaction Trend */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 font-display mb-4">Customer Satisfaction Trendline</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          {metrics.satisfactionTrend.map((st, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs font-bold text-gray-500">{st.month}</p>
              <p className="text-xl font-black text-gray-900 mt-1">{st.score} ★</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
