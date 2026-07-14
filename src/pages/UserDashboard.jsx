import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Clock, Search, MapPin, Settings as SettingsIcon, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export const UserDashboard = () => {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [recentViews, setRecentViews] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  console.log('🏠 Dashboard render:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    authLoading,
    profileName: profile?.full_name 
  })

  useEffect(() => {
    if (user && profile) {
      loadData()
    }
  }, [user, profile])

  const loadData = async () => {
    try {
      setDataLoading(true)
      console.log('🏠 Loading dashboard data...')

      const [favRes, recentRes] = await Promise.all([
        supabase
          .from('favorites')
          .select('property_id, properties(id, title, price, city, images)')
          .eq('user_id', user.id)
          .limit(6),
        supabase
          .from('recently_viewed')
          .select('property_id, properties(id, title, price, city, images)')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(6)
      ])

      setFavorites(favRes.data?.filter(item => item.properties) || [])
      setRecentViews(recentRes.data?.filter(item => item.properties) || [])
      
      console.log('✅ Dashboard data loaded')
    } catch (error) {
      console.error('❌ Dashboard data error:', error)
    } finally {
      setDataLoading(false)
    }
  }

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Must have user and profile to show dashboard
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load dashboard</p>
          <Link to="/" className="text-[#CA3433] hover:underline">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#CA3433] shadow-sm bg-gray-200">
              <img 
                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hello, {profile.full_name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-gray-600">
                Welcome to your dashboard
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-[#CA3433]">
                {favorites.length}
              </div>
              <div className="text-gray-500">Saved</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[#CA3433]">
                {recentViews.length}
              </div>
              <div className="text-gray-500">Recent</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { to: '/search', icon: Search, label: 'Find Properties', color: 'bg-[#CA3433] text-white' },
            { to: '/dashboard/saved', icon: Heart, label: 'Saved Properties', color: 'bg-red-50 text-red-600' },
            { to: '/nearby', icon: MapPin, label: 'Nearby Services', color: 'bg-blue-50 text-blue-600' },
            { to: '/settings', icon: SettingsIcon, label: 'Settings', color: 'bg-gray-50 text-gray-600' }
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all text-center group"
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon size={20} />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
            </Link>
          ))}
        </div>

        {/* Saved Properties */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Heart size={20} className="text-[#CA3433]" />
              Saved Properties
            </h2>
            {favorites.length > 0 && (
              <Link to="/dashboard/saved" className="text-[#CA3433] hover:underline text-sm font-medium">
                View All →
              </Link>
            )}
          </div>

          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="bg-white p-10 rounded-xl border border-gray-200 text-center">
              <Heart size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No Saved Properties</h3>
              <p className="text-gray-600 mb-6">Start exploring and save your favorites</p>
              <Link 
                to="/search"
                className="bg-[#CA3433] text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.slice(0, 6).map((item) => (
                <PropertyCard
                  key={item.property_id}
                  property={item.properties}
                  onClick={() => navigate(`/property/${item.property_id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent Views */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Clock size={20} className="text-[#CA3433]" />
            <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
          </div>

          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentViews.length === 0 ? (
            <div className="bg-white p-10 rounded-xl border border-gray-200 text-center">
              <Clock size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No Recent Activity</h3>
              <p className="text-gray-600">Properties you view will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentViews.slice(0, 6).map((item) => (
                <PropertyCard
                  key={item.property_id}
                  property={item.properties}
                  onClick={() => navigate(`/property/${item.property_id}`)}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

const PropertyCard = ({ property, onClick }) => (
  <div 
    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <div className="aspect-video bg-gray-100 flex items-center justify-center">
      {property?.images?.[0] ? (
        <img 
          src={property.images[0]} 
          alt={property.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <User size={40} className="text-gray-300" />
      )}
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
        {property?.title || 'Property'}
      </h3>
      <p className="text-gray-600 text-sm mb-2">
        {property?.city || 'Location'}
      </p>
      <p className="text-[#CA3433] font-bold">
        ₹{property?.price ? property.price.toLocaleString() : '0'}/month
      </p>
    </div>
  </div>
)