import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Clock, ChevronLeft, Bell, Calendar, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useProperties } from '../hooks/useProperties'
import { PropertyCard } from '../components/property/PropertyCard'
import { RecommendedSection } from '../components/property/RecommendedSection'
import { supabase } from '../lib/supabase'
import { MOCK_PROPERTIES } from '../utils/constants'
import { Skeleton } from '../components/ui/Skeleton'
import { SEOHead } from '../components/common/SEOHead'

export const UserDashboard = () => {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { favorites, recentlyViewed } = useProperties()
  const [favProps, setFavProps] = useState([])
  const [recentProps, setRecentProps] = useState([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [myVisits, setMyVisits] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (user) {
      loadProperties()
      loadUserData()
    }
  }, [user, favorites, recentlyViewed])

  const loadUserData = async () => {
    if (!user) return
    try {
      setLoadingData(true)
      const [notifRes, visitRes] = await Promise.all([
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('site_visits').select('*, property:properties(title, city)').eq('user_id', user.id).order('created_at', { ascending: false })
      ])
      if (!notifRes.error) setNotifications(notifRes.data || [])
      if (!visitRes.error) setMyVisits(visitRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingData(false)
    }
  }

  const markAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
      setNotifications(prev => prev.map(n => ({...n, is_read: true})))
    } catch (err) { console.error(err) }
  }
  
  const unreadCount = notifications.filter(n => !n.is_read).length

  const loadProperties = async () => {
    if (!user) return
    if (favProps.length === 0 && recentProps.length === 0) setLoading(true)
    try {
      if (favorites.length > 0) {
        const { data } = await supabase.from('properties').select('*').in('id', favorites)
        if (data) {
          const ordered = favorites.map(id => data.find(p => p.id === id)).filter(Boolean)
          setFavProps(ordered)
        }
      } else { setFavProps([]) }

      if (recentlyViewed.length > 0) {
        const { data } = await supabase.from('properties').select('*').in('id', recentlyViewed)
        if (data) {
          const ordered = recentlyViewed.map(id => data.find(p => p.id === id)).filter(Boolean)
          setRecentProps(ordered)
        }
      } else { setRecentProps([]) }
    } catch (err) {
      setFavProps(MOCK_PROPERTIES.filter(p => favorites.includes(p.id)))
      setRecentProps(recentlyViewed.map(id => MOCK_PROPERTIES.find(p => p.id === id)).filter(Boolean))
    } finally { setLoading(false) }
  }

  const LoadingRow = () => (
    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex-shrink-0 w-64 rounded-xl bg-white border border-gray-100 p-3 space-y-3">
          <Skeleton className="h-44 w-full rounded-xl" />
          <div className="space-y-2 px-1">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <div className="pt-1 flex gap-2">
              <Skeleton className="h-3 w-1/4 rounded-full" />
              <Skeleton className="h-3 w-1/4 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <SEOHead title="Dashboard" />
      <div className="pt-4 pb-20 bg-gray-50 min-h-screen">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-10 w-full relative">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-brand-200 bg-gray-200 shadow-sm flex-shrink-0">
                {profile ? (
                  <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Skeleton variant="circle" className="w-full h-full" />
                )}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-display leading-tight">
                  {profile ? t('userDashboard.hi', { name: profile?.full_name?.split(' ')[0] || 'User' }) : <Skeleton className="h-8 w-32" />}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">{t('userDashboard.subtitle')}</p>
              </div>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 text-yellow-500 hover:text-yellow-600 transition-all relative cursor-pointer active:scale-95`}
              >
                <Bell size={24} className="fill-current" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm ring-2 ring-red-500/20 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-gray-100 p-4 z-50">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                    <h3 className="font-bold text-gray-900">{t('notifications.title')}</h3>
                    {unreadCount > 0 && <button onClick={markAsRead} className="text-xs font-bold text-[#CA3433] hover:underline px-2 py-1 rounded-md hover:bg-red-50 transition-colors">{t('notifications.markAllRead')}</button>}
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6">
                        <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 font-medium">{t('notifications.noNotifs')}</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 rounded-xl border transition-colors ${n.is_read ? 'bg-white border-gray-100 text-gray-500' : 'bg-[#fffcf0] border-yellow-200 text-gray-900'}`}>
                          <p className={`text-[13px] leading-relaxed ${n.is_read ? 'font-medium' : 'font-semibold'}`}>{n.message}</p>
                          <p className="text-[10px] mt-2 text-gray-400 font-bold uppercase tracking-wider">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Onboarding Recommendations */}
          {profile?.onboarding_data && !profile?.onboarding_data?.skipped && (
            <div className="mb-10">
              <RecommendedSection />
            </div>
          )}

          {/* Saved Properties */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Heart size={24} className="text-[#CA3433]" fill="currentColor" />
                <div>
                  <h2 className="text-xl font-black text-gray-900 font-display leading-none">{t('userDashboard.savedProperties')}</h2>
                  {!loading && <span className="text-xs font-bold text-gray-400 mt-1 block uppercase tracking-wider">{favProps.length} {t('userDashboard.items')}</span>}
                </div>
              </div>
              
              {favProps.length > 0 && (
                <Link to="/dashboard/saved" className="text-sm font-extrabold text-[#CA3433] hover:underline flex items-center gap-1 group">
                  {t('userDashboard.viewAll')}
                  <ChevronLeft size={16} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>

            {loading ? (
              <LoadingRow />
            ) : favProps.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center shadow-sm">
                <p className="text-gray-500 font-medium mb-4">{t('userDashboard.noSaved')}</p>
                <Link to="/search" className="bg-[#fdf2f2] text-[#CA3433] px-6 py-2.5 rounded-xl font-bold hover:bg-[#fbe1e1] transition-colors inline-block">{t('userDashboard.explore')}</Link>
              </div>
            ) : (
              <div className="flex gap-5 overflow-x-auto pb-4 px-1 -mx-1 scrollbar-hide">
                {favProps.slice(0, 3).map(p => (
                  <div key={p.id} className="flex-shrink-0 w-64">
                    <PropertyCard property={p} compact />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Viewed */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Clock size={24} className="text-[#CA3433]" />
              <div>
                <h2 className="text-xl font-black text-gray-900 font-display leading-none">{t('userDashboard.recentlyViewed')}</h2>
                <p className="text-[10px] text-gray-400 mt-1 font-medium bg-gray-50 px-2 py-0.5 rounded-md inline-block">{t('userDashboard.autoClear')}</p>
              </div>
            </div>

            {loading ? (
              <LoadingRow />
            ) : recentProps.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center shadow-sm">
                <p className="text-gray-500 font-medium">{t('userDashboard.noRecent')}</p>
              </div>
            ) : (
              <div className="flex gap-5 overflow-x-auto pb-4 px-1 -mx-1 scrollbar-hide">
                {recentProps.map(p => (
                  <div key={p.id} className="flex-shrink-0 w-64">
                    <PropertyCard property={p} compact />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Site Visits */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Calendar size={24} className="text-orange-500" />
              <div>
                <h2 className="text-xl font-black text-gray-900 font-display leading-none">{t('userDashboard.myVisits')}</h2>
                {!loadingData && <span className="text-[10px] text-gray-400 mt-1 font-medium bg-gray-50 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider">
                  {myVisits.length} {t('userDashboard.requests')}
                </span>}
              </div>
            </div>

            {loadingData ? (
              <LoadingRow />
            ) : myVisits.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center shadow-sm">
                <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium font-display">{t('userDashboard.noVisits')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myVisits.map(visit => (
                  <div key={visit.id} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgb(0,0,0,0.05)] transition-all cursor-pointer" onClick={() => navigate(`/property/${visit.property_id}`)}>
                    <div className="flex justify-between items-start">
                      <div className="pr-2">
                        <h3 className="font-bold text-gray-900 line-clamp-1 text-[15px] hover:text-[#CA3433] transition-colors">{visit.property?.title || 'Property Unavaliable'}</h3>
                        <p className="text-[13px] text-gray-500 mt-1 flex items-center gap-1"><MapPin size={12} className="text-gray-400"/>{visit.property?.city || 'Unknown'}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border ${
                        visit.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                        visit.status === 'declined' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {visit.status === 'approved' ? t('userDashboard.status.approved') : 
                         visit.status === 'declined' ? t('userDashboard.status.declined') : 
                         t('userDashboard.status.pending')}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-700 font-semibold bg-gray-50/50 rounded-lg p-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(visit.visit_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
