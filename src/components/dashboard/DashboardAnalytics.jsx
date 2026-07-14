import React, { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, Eye, Heart, Search, Calendar } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export const DashboardAnalytics = () => {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalSaved: 0,
    totalSearches: 0,
    totalApplications: 0,
    averageBudget: 0,
    topLocations: [],
    activityOverTime: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30') // days

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, timeRange])

  const loadAnalytics = async () => {
    try {
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - parseInt(timeRange))

      const [
        favoritesRes,
        searchHistoryRes,
        applicationsRes,
        recentViewsRes
      ] = await Promise.all([
        supabase
          .from('favorites')
          .select('created_at, property:properties(city)')
          .eq('user_id', user.id)
          .gte('created_at', dateFrom.toISOString()),
        supabase
          .from('search_history')
          .select('created_at, location, budget')
          .eq('user_id', user.id)
          .gte('created_at', dateFrom.toISOString()),
        supabase
          .from('rental_applications')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', dateFrom.toISOString()),
        supabase
          .from('recently_viewed')
          .select('viewed_at')
          .eq('user_id', user.id)
          .gte('viewed_at', dateFrom.toISOString())
      ])

      // Calculate analytics
      const totalSaved = favoritesRes.data?.length || 0
      const totalSearches = searchHistoryRes.data?.length || 0
      const totalApplications = applicationsRes.data?.length || 0
      const totalViews = recentViewsRes.data?.length || 0

      // Calculate average budget
      const budgets = searchHistoryRes.data?.map(s => s.budget).filter(Boolean) || []
      const averageBudget = budgets.length > 0 
        ? Math.round(budgets.reduce((sum, budget) => sum + budget, 0) / budgets.length)
        : 0

      // Top locations from searches and favorites
      const locationCounts = {}
      searchHistoryRes.data?.forEach(search => {
        if (search.location) {
          locationCounts[search.location] = (locationCounts[search.location] || 0) + 1
        }
      })
      favoritesRes.data?.forEach(fav => {
        if (fav.property?.city) {
          locationCounts[fav.property.city] = (locationCounts[fav.property.city] || 0) + 1
        }
      })

      const topLocations = Object.entries(locationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({ location, count }))

      // Activity over time (weekly)
      const activityOverTime = []
      for (let i = parseInt(timeRange); i >= 0; i -= 7) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - i)
        const weekEnd = new Date()
        weekEnd.setDate(weekEnd.getDate() - Math.max(0, i - 7))

        const weekSearches = searchHistoryRes.data?.filter(s => 
          new Date(s.created_at) >= weekStart && new Date(s.created_at) < weekEnd
        ).length || 0

        const weekSaves = favoritesRes.data?.filter(f => 
          new Date(f.created_at) >= weekStart && new Date(f.created_at) < weekEnd
        ).length || 0

        activityOverTime.push({
          week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          searches: weekSearches,
          saves: weekSaves
        })
      }

      setAnalytics({
        totalViews,
        totalSaved,
        totalSearches,
        totalApplications,
        averageBudget,
        topLocations,
        activityOverTime
      })

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 size={20} className="text-[#CA3433]" />
          Your Activity Analytics
        </h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#CA3433] focus:border-transparent"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 3 months</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Eye size={16} />
            <span className="text-xs font-medium">Properties Viewed</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{analytics.totalViews}</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <Heart size={16} />
            <span className="text-xs font-medium">Properties Saved</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{analytics.totalSaved}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Search size={16} />
            <span className="text-xs font-medium">Searches Made</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{analytics.totalSearches}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Calendar size={16} />
            <span className="text-xs font-medium">Applications</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{analytics.totalApplications}</p>
        </div>
      </div>

      {/* Average Budget */}
      {analytics.averageBudget > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <TrendingUp size={16} />
            <span className="text-sm font-medium">Average Search Budget</span>
          </div>
          <p className="text-xl font-bold text-gray-800">₹{analytics.averageBudget.toLocaleString()}</p>
        </div>
      )}

      {/* Top Locations */}
      {analytics.topLocations.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-gray-800 mb-3">Most Searched Locations</h4>
          <div className="space-y-2">
            {analytics.topLocations.map((location, index) => (
              <div key={location.location} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{location.location}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#CA3433] rounded-full"
                      style={{ width: `${(location.count / analytics.topLocations[0].count) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-6">{location.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Chart */}
      {analytics.activityOverTime.length > 0 && (
        <div>
          <h4 className="font-bold text-gray-800 mb-3">Activity Over Time</h4>
          <div className="flex items-end justify-between h-32 gap-2">
            {analytics.activityOverTime.map((week, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col gap-1 mb-2">
                  <div 
                    className="bg-blue-200 rounded-t"
                    style={{ 
                      height: `${Math.max(4, (week.searches / Math.max(...analytics.activityOverTime.map(w => Math.max(w.searches, w.saves)))) * 80)}px` 
                    }}
                  ></div>
                  <div 
                    className="bg-red-200 rounded-b"
                    style={{ 
                      height: `${Math.max(4, (week.saves / Math.max(...analytics.activityOverTime.map(w => Math.max(w.searches, w.saves)))) * 80)}px` 
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 text-center">{week.week}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span>Searches</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 rounded"></div>
              <span>Saves</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}