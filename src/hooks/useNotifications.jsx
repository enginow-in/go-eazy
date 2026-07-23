import React, { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'
import {
  addNotification,
  markAsRead,
  markAllAsRead,
  toggleArchive,
  deleteNotification,
  clearAllNotifications,
  updatePreferences,
  setFilterCategory,
  setFilterStatus,
  setSearchQuery
} from '../store/notificationSlice'
import { toast as hotToast } from 'react-hot-toast'

export const useNotifications = () => {
  const dispatch = useDispatch()
  const { user, role } = useSelector(s => s.auth)
  const {
    items,
    unreadCount,
    preferences,
    filterCategory,
    filterStatus,
    searchQuery,
    loading
  } = useSelector(s => s.notifications)

  // Real-time Supabase subscription for user notifications
  useEffect(() => {
    if (!user?.id) return

    let channel
    try {
      // Use unique channel topic to prevent "cannot add postgres_changes callbacks after subscribe()" when re-subscribing
      const channelTopic = `realtime-notif-${user.id}-${Math.random().toString(36).substring(2, 8)}`
      
      channel = supabase
        .channel(channelTopic)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotif = payload.new
            if (!newNotif) return
            const notificationData = {
              id: newNotif.id,
              userId: newNotif.user_id,
              role: newNotif.role || 'user',
              type: newNotif.type,
              title: newNotif.title,
              message: newNotif.message,
              read: newNotif.read || false,
              archived: newNotif.archived || false,
              createdAt: newNotif.created_at || new Date().toISOString(),
              actionUrl: newNotif.action_url || null,
              metadata: newNotif.metadata || {}
            }
            
            dispatch(addNotification(notificationData))

            if (preferences.channels.inApp) {
              hotToast(
                (t) => (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#fff5f5] text-[#CA3433] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      🔔
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{notificationData.title}</p>
                      <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">{notificationData.message}</p>
                    </div>
                  </div>
                ),
                { duration: 4000, position: 'top-right' }
              )
            }
          }
        )

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Channel active
        }
      })
    } catch (err) {
      console.warn('Realtime notifications fallback to local mode:', err)
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (e) {
          // Ignore cleanup error
        }
      }
    }
  }, [user?.id, dispatch, preferences.channels.inApp])

  // Trigger a new notification locally + send to Supabase if connected
  const sendNotification = useCallback(
    async ({ recipientId, recipientRole, type, title, message, actionUrl, metadata }) => {
      const payload = {
        userId: recipientId || user?.id || 'demo-user',
        role: recipientRole || role || 'user',
        type: type || 'system_alert',
        title,
        message,
        actionUrl: actionUrl || null,
        metadata: metadata || {}
      }

      // Dispatch locally first for instant UI response
      dispatch(addNotification(payload))

      // Toast alert
      if (preferences.channels.inApp) {
        hotToast.success(`Notification sent: ${title}`, { position: 'bottom-right' })
      }

      // Sync with Supabase asynchronously if authenticated
      if (user?.id) {
        try {
          await supabase.from('notifications').insert([
            {
              user_id: payload.userId,
              role: payload.role,
              type: payload.type,
              title: payload.title,
              message: payload.message,
              action_url: payload.actionUrl,
              metadata: payload.metadata,
              read: false,
              archived: false
            }
          ])
        } catch (err) {
          console.warn('Supabase sync notice (using local state fallback):', err.message)
        }
      }
    },
    [dispatch, user?.id, role, preferences.channels.inApp]
  )

  // Actions
  const markRead = useCallback((id) => dispatch(markAsRead(id)), [dispatch])
  const markAllRead = useCallback(() => dispatch(markAllAsRead()), [dispatch])
  const archiveItem = useCallback((id) => dispatch(toggleArchive(id)), [dispatch])
  const deleteItem = useCallback((id) => dispatch(deleteNotification(id)), [dispatch])
  const clearAll = useCallback(() => dispatch(clearAllNotifications()), [dispatch])
  const savePreferences = useCallback((newPrefs) => dispatch(updatePreferences(newPrefs)), [dispatch])
  const setCategoryFilter = useCallback((cat) => dispatch(setFilterCategory(cat)), [dispatch])
  const setStatusFilter = useCallback((st) => dispatch(setFilterStatus(st)), [dispatch])
  const setSearch = useCallback((query) => dispatch(setSearchQuery(query)), [dispatch])

  // Filtered notifications logic
  const filteredNotifications = items.filter((n) => {
    // Status Filter
    if (filterStatus === 'unread' && (n.read || n.archived)) return false
    if (filterStatus === 'archived' && !n.archived) return false
    if (filterStatus === 'all' && n.archived) return false // hide archived by default in 'all'

    // Category Filter
    if (filterCategory === 'inquiries' && n.type !== 'property_inquiry') return false
    if (filterCategory === 'payments' && n.type !== 'payment_confirmation') return false
    if (filterCategory === 'services' && n.type !== 'service_approval') return false
    if (filterCategory === 'system' && n.type !== 'system_alert') return false

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = n.title.toLowerCase().includes(q)
      const matchMsg = n.message.toLowerCase().includes(q)
      if (!matchTitle && !matchMsg) return false
    }

    return true
  })

  return {
    notifications: items,
    filteredNotifications,
    unreadCount,
    preferences,
    filterCategory,
    filterStatus,
    searchQuery,
    loading,
    sendNotification,
    markRead,
    markAllRead,
    archiveItem,
    deleteItem,
    clearAll,
    savePreferences,
    setCategoryFilter,
    setStatusFilter,
    setSearch
  }
}
