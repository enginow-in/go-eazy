import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart, Clock, Search, MapPin, Settings as SettingsIcon, User, BrainCircuit, Briefcase, BarChart2, ChevronRight,
  X, Edit, FileText, Calendar, MessageSquare, CheckCircle, ArrowRight, UploadCloud,
  Shield, Trash2, Palette, Languages, Layers, GitCompare, Star, History, LayoutGrid, UserCircle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { PropertyCard } from '../components/property/PropertyCard'
import { Skeleton } from '../components/ui/Skeleton'
import { formatDistanceToNow } from 'date-fns'
import { SearchHistory } from '../components/dashboard/SearchHistory'
import { NotificationCard } from '../components/dashboard/NotificationCard'
import { AIRecommendations } from '../components/dashboard/AIRecommendations'
import { NearbyProperties } from '../components/dashboard/NearbyProperties'
import { UserPreferences } from '../components/dashboard/UserPreferences'

const StatCard = ({ icon, label, value, loading }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      {loading ? (
        <Skeleton className="h-6 w-12 mt-1" />
      ) : (
        <h3 className="text-xl font-bold text-gray-900">{value}</h3>
      )}
    </div>
  </div>
)

export const UserDashboard = () => {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [recentViews, setRecentViews] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [applications, setApplications] = useState([])
  const [siteVisits, setSiteVisits] = useState([])
  const [documents, setDocuments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState({ applications: 0, bookings: 0, messages: 0, notifications: 0 })
  const [dataLoading, setDataLoading] = useState(true)
  const [showPreferences, setShowPreferences] = useState(false)

  useEffect(() => {
    if (user && profile) {
      loadData() // eslint-disable-line
    }
  }, [user, profile])

  const loadData = async () => {
    try {
      const [favRes, recentRes, recommendationsRes, appsRes, visitsRes, docsRes, notificationsRes] = await Promise.all([
        supabase
          .from('favorites')
          .select('property:properties(*)', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('recently_viewed')
          .select('property:properties(*)')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(3),
        // AI recommendations - for now, fetch most popular properties
        supabase
          .from('properties')
          .select('*')
          .order('views', { ascending: false })
          .limit(3),
        // Fetch rental applications
        supabase
          .from('rental_applications')
          .select('*, property:properties(id, title, images, city, area)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        // Fetch site visits
        supabase
          .from('site_visits')
          .select('*, property:properties(id, title, images, city, area)')
          .eq('user_id', user.id)
          .order('visit_date', { ascending: false }),
        // Fetch user documents
        supabase
          .from('user_documents')
          .select('*')
          .eq('user_id', user.id),
        // Fetch notifications
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      if (favRes.error) throw favRes.error
      if (recentRes.error) throw recentRes.error
      if (recommendationsRes.error) throw recommendationsRes.error

      setFavorites(favRes.data?.map(item => item.property).filter(Boolean) || [])
      setRecentViews(recentRes.data?.map(item => item.property).filter(Boolean) || [])
      setRecommendations(recommendationsRes.data || [])

      // Handle applications with error fallback
      if (appsRes.data) {
        setApplications(appsRes.data || [])
      }

      // Handle visits with error fallback
      if (visitsRes.data) {
        setSiteVisits(visitsRes.data || [])
      }

      // Handle documents with error fallback
      if (docsRes.data) {
        setDocuments(docsRes.data || [])
      }

      // Handle notifications with error fallback
      if (notificationsRes.data) {
        setNotifications(notificationsRes.data || [])
      }

      setStats({ 
        applications: appsRes.data?.length || 0, 
        bookings: visitsRes.data?.filter(v => v.status === 'approved').length || 0, 
        messages: 0,
        notifications: notificationsRes.data?.length || 0
      })

    } catch (error) {
      console.error('❌ Dashboard data error:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const getProfileCompletion = () => {
    if (!profile) return 0
    let score = 0
    if (profile.full_name) score += 40
    if (profile.avatar_url) score += 30
    if (profile.phone) score += 30
    return score
  }

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Must have user and profile to show dashboard
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
          <p className="text-gray-600 mb-4">Unable to load dashboard</p>
          <Link to="/" className="text-[#CA3433] hover:underline">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-6 pb-32 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-200 shrink-0">
              <img 
                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                Hello, {profile.full_name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-sm text-gray-500 font-medium flex items-center gap-4">
                <span>Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Last login: {formatDistanceToNow(new Date(user.last_sign_in_at || user.created_at), { addSuffix: true })}</span>
              </p>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm w-full sm:w-auto sm:max-w-xs">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-gray-500">Profile Completion</p>
              <p className="text-xs font-bold text-[#CA3433]">{getProfileCompletion()}%</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-[#CA3433] h-1.5 rounded-full" style={{ width: `${getProfileCompletion()}%` }}></div>
            </div>
          </div>
        </div>

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          <StatCard icon={<Heart size={18} />} label="Saved Properties" value={favorites.length} loading={dataLoading} />
          <StatCard icon={<FileText size={18} />} label="Applications" value={stats.applications} loading={dataLoading} />
          <StatCard icon={<Calendar size={18} />} label="Bookings" value={stats.bookings} loading={dataLoading} />
          <StatCard icon={<MessageSquare size={18} />} label="Messages" value={stats.messages} loading={dataLoading} />
          <StatCard icon={<CheckCircle size={18} />} label="Notifications" value={stats.notifications} loading={dataLoading} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-10">
          {[
            { to: '/search', icon: Search, label: 'New Search' },
            { to: '/dashboard/saved', icon: Heart, label: 'Saved' },
            { to: '/nearby', icon: MapPin, label: 'Nearby' },
            { to: '/dashboard/applications', icon: FileText, label: 'Applications' },
            { to: '/dashboard/visits', icon: Calendar, label: 'Visits' },
            { onClick: () => setShowPreferences(!showPreferences), icon: SettingsIcon, label: 'Preferences' }
          ].map((action, index) => (
            action.to ? (
              <Link
                key={action.to}
                to={action.to}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#CA3433]/30 transition-all text-center group flex flex-col items-center justify-center"
              >
                <div className="w-10 h-10 bg-red-50 text-[#CA3433] rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <action.icon size={20} />
                </div>
                <p className="font-bold text-gray-800 text-xs">{action.label}</p>
              </Link>
            ) : (
              <button
                key={index}
                onClick={action.onClick}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#CA3433]/30 transition-all text-center group flex flex-col items-center justify-center"
              >
                <div className="w-10 h-10 bg-red-50 text-[#CA3433] rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <action.icon size={20} />
                </div>
                <p className="font-bold text-gray-800 text-xs">{action.label}</p>
              </button>
            )
          ))}
        </div>

        {/* User Preferences Modal */}
        {showPreferences && (
          <div className="mb-12">
            <UserPreferences />
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle size={20} className="text-[#CA3433]" />
              <h2 className="text-xl font-bold text-gray-900">Recent Notifications</h2>
            </div>
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
                />
              ))}
            </div>
          </section>
        )}

        {/* Saved Properties */}
        <section id="saved" className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Heart size={20} className="text-[#CA3433]" />
              Saved Properties
            </h2>
            {favorites.length > 3 && (
              <Link to="/dashboard/saved" className="text-[#CA3433] hover:underline text-sm font-bold flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
            </div>
          ) : favorites.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={28} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">No Saved Properties</h3>
              <p className="text-sm text-gray-500 mb-6">Click the heart icon on a listing to save it.</p>
              <Link 
                to="/search"
                className="bg-[#CA3433] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
              >
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.slice(0, 3).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </section>

        {/* AI Recommendations */}
        <section id="recommendations" className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BrainCircuit size={20} className="text-[#CA3433]" />
              Recommended For You
            </h2>
          </div>
          <AIRecommendations />
        </section>

        {/* Nearby Properties */}
        <section id="nearby" className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <MapPin size={20} className="text-[#CA3433]" />
            <h2 className="text-xl font-bold text-gray-900">Nearby Properties</h2>
          </div>
          <NearbyProperties />
        </section>

        {/* Rental Applications */}
        <section id="applications" className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase size={20} className="text-[#CA3433]" />
              Rental Applications
            </h2>
          </div>
          {dataLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase size={28} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">No Applications Sent</h3>
              <p className="text-sm text-gray-500">Your submitted applications will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 3).map(app => {
                const statusConfig = {
                  pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
                  approved: { text: 'Approved', color: 'bg-green-100 text-green-700' },
                  rejected: { text: 'Rejected', color: 'bg-red-100 text-red-700' },
                }[app.status] || { text: 'Unknown', color: 'bg-gray-100 text-gray-700' }

                return (
                  <div key={app.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <img src={app.property?.images?.[0]} alt={app.property?.title} className="w-20 h-20 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{app.property?.title}</h4>
                      <p className="text-xs text-gray-500">{app.property?.area}, {app.property?.city}</p>
                      <p className="text-xs text-gray-400 mt-1">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${statusConfig.color}`}>
                        {statusConfig.text}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Property Visits */}
        <section id="visits" className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-[#CA3433]" />
              Property Visits
            </h2>
          </div>
          {dataLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
            </div>
          ) : siteVisits.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">No Visits Scheduled</h3>
              <p className="text-sm text-gray-500 mb-6">Book a visit from a property's detail page.</p>
              <Link 
                to="/search"
                className="bg-[#CA3433] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
              >
                Find Properties
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {siteVisits.slice(0, 3).map(visit => {
                const statusConfig = {
                  pending: { text: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700' },
                  approved: { text: 'Approved', color: 'bg-green-100 text-green-700' },
                  declined: { text: 'Declined', color: 'bg-red-100 text-red-700' },
                  completed: { text: 'Completed', color: 'bg-blue-100 text-blue-700' },
                }[visit.status] || { text: 'Unknown', color: 'bg-gray-100 text-gray-700' }

                return (
                  <div key={visit.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <img src={visit.property?.images?.[0]} alt={visit.property?.title} className="w-20 h-20 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{visit.property?.title}</h4>
                      <p className="text-xs text-gray-500">Visit on: <span className="font-semibold text-gray-700">{new Date(visit.visit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${statusConfig.color}`}>
                          {statusConfig.text}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors">
                        <X size={14} />
                      </button>
                      <button className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Recent Views */}
        <section id="recent" className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Clock size={20} className="text-[#CA3433]" />
            <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
          </div>

          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
            </div>
          ) : recentViews.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={28} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">No Recent Activity</h3>
              <p className="text-sm text-gray-500">Properties you view will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentViews.slice(0, 3).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </section>

        {/* Interactive Map */}
        <section id="map" className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <MapPin size={20} className="text-[#CA3433]" />
            <h2 className="text-xl font-bold text-gray-900">Explore on Map</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="bg-gray-100 h-80 rounded-xl flex flex-col items-center justify-center p-4">
              <MapPin size={48} className="text-gray-400 mb-4" />
              <h3 className="font-bold text-gray-800 mb-2">Interactive Map Coming Soon</h3>
              <p className="text-sm text-gray-500 max-w-md">You'll be able to explore nearby properties, check travel times, and see local schools, hospitals, and metro stops right here.</p>
            </div>
          </div>
        </section>

        {/* Search History */}
        <section id="history" className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <History size={20} className="text-[#CA3433]" />
            <h2 className="text-xl font-bold text-gray-900">Search History</h2>
          </div>
          <SearchHistory />
        </section>

        {/* Dashboard Analytics */}
        <section id="analytics" className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 size={20} className="text-[#CA3433]" />
            <h2 className="text-xl font-bold text-gray-900">Dashboard Analytics</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="bg-gray-100 h-80 rounded-xl flex flex-col items-center justify-center p-4">
              <BarChart2 size={48} className="text-gray-400 mb-4" />
              <h3 className="font-bold text-gray-800 mb-2">Analytics Coming Soon</h3>
              <p className="text-sm text-gray-500 max-w-md">Visualize your property search journey with charts on properties viewed, applications sent, and more.</p>
            </div>
          </div>
        </section>

        {/* New Placeholder Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Compare Properties */}
          <section id="compare">
            <div className="flex items-center gap-2 mb-6">
              <GitCompare size={20} className="text-[#CA3433]" />
              <h2 className="text-xl font-bold text-gray-900">Compare Properties</h2>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center h-full flex flex-col justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <GitCompare size={28} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Compare up to 4 Properties</h3>
              <p className="text-sm text-gray-500">This feature is coming soon!</p>
            </div>
          </section>

          {/* Wishlist Collections */}
          <section id="wishlist">
            <div className="flex items-center gap-2 mb-6">
              <Layers size={20} className="text-[#CA3433]" />
              <h2 className="text-xl font-bold text-gray-900">Wishlist Collections</h2>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center h-full flex flex-col justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers size={28} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Organize Your Favorites</h3>
              <p className="text-sm text-gray-500">Soon you'll be able to create collections for vacations, family, or budget finds.</p>
            </div>
          </section>
        </div>

        {/* Document Management */}
        <section id="documents" className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <FileText size={20} className="text-[#CA3433]" />
            <h2 className="text-xl font-bold text-gray-900">My Documents</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UploadCloud size={28} className="text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">Upload Your Documents</h3>
                <p className="text-sm text-gray-500 mb-4">Store your Aadhar, PAN, and other documents for faster applications.</p>
                <button className="bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold text-sm">Upload Now</button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{doc.document_type}</p>
                    <button><Trash2 size={16} className="text-gray-400 hover:text-red-500" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Settings & Security */}
        <section id="settings-security" className="mb-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Appearance & Language */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Appearance & Language</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-sm flex items-center gap-2"><Palette size={16} /> Theme</span>
                  <div className="text-xs font-semibold flex gap-1 bg-gray-200 p-1 rounded-md">
                    <button className="px-2 py-0.5 rounded bg-white shadow">Light</button>
                    <button className="px-2 py-0.5">Dark</button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-sm flex items-center gap-2"><Languages size={16} /> Language</span>
                  <div className="text-xs font-semibold flex gap-1 bg-gray-200 p-1 rounded-md">
                    <button className="px-2 py-0.5 rounded bg-white shadow">EN</button>
                    <button className="px-2 py-0.5">HI</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Security & Account */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Security & Account</h3>
              <div className="space-y-2">
                <Link to="/settings" className="block text-sm font-medium text-blue-600 hover:underline">Two-Factor Authentication</Link>
                <Link to="/settings" className="block text-sm font-medium text-blue-600 hover:underline">Active Sessions</Link>
                <Link to="/settings" className="block text-sm font-medium text-red-600 hover:underline">Deactivate Account</Link>
                <Link to="/settings" className="block text-sm font-medium text-red-600 hover:underline">Delete Account</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Sticky Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
          <div className="grid grid-cols-5">
            <Link to="/dashboard" className="flex flex-col items-center justify-center p-2 text-[#CA3433]">
              <LayoutGrid size={20} />
              <span className="text-[10px] font-bold">Home</span>
            </Link>
            <a href="#applications" className="flex flex-col items-center justify-center p-2 text-gray-500">
              <Briefcase size={20} />
              <span className="text-[10px] font-bold">Apps</span>
            </a>
            <a href="#saved" className="flex flex-col items-center justify-center p-2 text-gray-500">
              <Heart size={20} />
              <span className="text-[10px] font-bold">Saved</span>
            </a>
            <a href="#visits" className="flex flex-col items-center justify-center p-2 text-gray-500">
              <Calendar size={20} />
              <span className="text-[10px] font-bold">Visits</span>
            </a>
            <Link to="/settings" className="flex flex-col items-center justify-center p-2 text-gray-500">
              <UserCircle size={20} />
              <span className="text-[10px] font-bold">Profile</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}