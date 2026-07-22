import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, Eye, Calendar, MessageCircle } from 'lucide-react'

const MOCK_WEEKLY_DATA = [
  { day: 'Mon', views: 45, visits: 3 },
  { day: 'Tue', views: 62, visits: 5 },
  { day: 'Wed', views: 38, visits: 2 },
  { day: 'Thu', views: 71, visits: 7 },
  { day: 'Fri', views: 53, visits: 4 },
  { day: 'Sat', views: 84, visits: 9 },
  { day: 'Sun', views: 29, visits: 1 },
]

export const AnalyticsChart = ({ weeklyData = MOCK_WEEKLY_DATA, totalViews = 382, totalVisits = 31, totalMessages = 14 }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
          <TrendingUp size={20} className="text-[#CA3433]" />
          Analytics
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <Eye size={20} className="mx-auto text-blue-600 mb-1" />
          <p className="text-2xl font-black text-gray-900">{totalViews}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Views</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <Calendar size={20} className="mx-auto text-green-600 mb-1" />
          <p className="text-2xl font-black text-gray-900">{totalVisits}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Visits</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <MessageCircle size={20} className="mx-auto text-purple-600 mb-1" />
          <p className="text-2xl font-black text-gray-900">{totalMessages}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Messages</p>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} barGap={4} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              labelStyle={{ fontWeight: 700 }}
            />
            <Bar dataKey="views" fill="#CA3433" radius={[6, 6, 0, 0]} name="Views" />
            <Bar dataKey="visits" fill="#22c55e" radius={[6, 6, 0, 0]} name="Site Visits" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
