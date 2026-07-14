import React, { useState, useEffect } from 'react'
import { Clock, MapPin, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export const SearchHistory = () => {
  const { user } = useAuth()
  const [searchHistory, setSearchHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadSearchHistory()
    }
  }, [user])

  const loadSearchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setSearchHistory(data || [])
    } catch (error) {
      console.error('Error loading search history:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteSearchItem = async (id) => {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSearchHistory(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting search:', error)
    }
  }

  const clearAllHistory = async () => {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      setSearchHistory([])
    } catch (error) {
      console.error('Error clearing history:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (searchHistory.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search size={28} className="text-gray-300" />
        </div>
        <h3 className="font-bold text-gray-800 mb-1">No Search History</h3>
        <p className="text-sm text-gray-500">Your recent searches will appear here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Recent Searches</h3>
        <button
          onClick={clearAllHistory}
          className="text-sm text-red-600 hover:underline font-medium"
        >
          Clear All
        </button>
      </div>
      
      <div className="space-y-3">
        {searchHistory.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Search size={16} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {item.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{item.location}</span>
                  </div>
                )}
                {item.budget && (
                  <span className="text-sm text-gray-500">₹{item.budget}</span>
                )}
                {item.property_type && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {item.property_type}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={12} />
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={() => deleteSearchItem(item.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}