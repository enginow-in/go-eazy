import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Bell, ArrowLeft, CheckCheck, Trash2, Calendar, MessageCircle, Search, CreditCard, ExternalLink } from 'lucide-react'
import { markAsRead, markAllAsRead, removeNotification, clearAll } from '../store/notificationSlice'
import { getTimeAgo, cn } from '../utils/helpers'

const NOTIF_ICONS = {
  visit_approved: Calendar,
  new_message: MessageCircle,
  search_match: Search,
  payment_success: CreditCard,
}

const NOTIF_COLORS = {
  visit_approved: 'text-green-600 bg-green-50',
  new_message: 'text-blue-600 bg-blue-50',
  search_match: 'text-purple-600 bg-purple-50',
  payment_success: 'text-emerald-600 bg-emerald-50',
}

export const Notifications = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, unreadCount } = useSelector(s => s.notifications)

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 font-display">Notifications</h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">{items.length} total{unreadCount > 0 ? `, ${unreadCount} unread` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllAsRead())}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                <CheckCheck size={16} /> Mark All Read
              </button>
            )}
            {items.length > 0 && (
              <button
                onClick={() => dispatch(clearAll())}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={16} /> Clear All
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
          {items.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <Bell size={32} className="text-gray-200" />
              </div>
              <p className="text-lg font-bold text-gray-400">All caught up!</p>
              <p className="text-sm text-gray-400 mt-1">No notifications to show.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(notif => {
                const Icon = NOTIF_ICONS[notif.type] || Bell
                const colorClass = NOTIF_COLORS[notif.type] || 'text-gray-600 bg-gray-50'
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-4 px-6 py-5 transition-colors group',
                      notif.is_read ? 'bg-white hover:bg-gray-50' : 'bg-[#FFF8F8] hover:bg-[#FFF0F0]'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5', colorClass)}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className={cn('text-sm leading-relaxed', notif.is_read ? 'text-gray-600' : 'text-gray-900 font-semibold')}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {notif.link && (
                            <button
                              onClick={() => navigate(notif.link)}
                              className="p-1.5 text-gray-300 hover:text-[#CA3433] transition-colors"
                            >
                              <ExternalLink size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => dispatch(removeNotification(notif.id))}
                            className="p-1.5 text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400 font-medium">{getTimeAgo(notif.created_at)}</span>
                        {!notif.is_read && (
                          <button
                            onClick={() => dispatch(markAsRead(notif.id))}
                            className="text-xs font-bold text-[#CA3433] hover:text-[#ac2d2c]"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
