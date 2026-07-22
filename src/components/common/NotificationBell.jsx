import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, X, Trash2, ExternalLink, Calendar, MessageCircle, Search, CreditCard } from 'lucide-react'
import { toggleDropdown, closeDropdown, markAsRead, markAllAsRead, removeNotification } from '../../store/notificationSlice'
import { getTimeAgo } from '../../utils/helpers'
import { cn } from '../../utils/helpers'

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

export const NotificationBell = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, unreadCount, dropdownOpen } = useSelector(s => s.notifications)

  const handleNotifClick = (notif) => {
    if (!notif.is_read) dispatch(markAsRead(notif.id))
    dispatch(closeDropdown())
    if (notif.link) navigate(notif.link)
  }

  return (
    <div className="relative">
      <button
        onClick={() => dispatch(toggleDropdown())}
        className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[#CA3433] text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => dispatch(closeDropdown())} />
          <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => dispatch(markAllAsRead())}
                    className="flex items-center gap-1 text-xs font-bold text-[#CA3433] hover:text-[#ac2d2c] transition-colors"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={32} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {items.map(notif => {
                    const Icon = NOTIF_ICONS[notif.type] || Bell
                    const colorClass = NOTIF_COLORS[notif.type] || 'text-gray-600 bg-gray-50'
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={cn(
                          'flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors group',
                          notif.is_read ? 'bg-white hover:bg-gray-50' : 'bg-[#FFF8F8] hover:bg-[#FFF0F0]'
                        )}
                      >
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5', colorClass)}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm leading-relaxed', notif.is_read ? 'text-gray-600' : 'text-gray-900 font-semibold')}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1.5 font-medium">{getTimeAgo(notif.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {notif.link && (
                            <ExternalLink size={14} className="text-gray-300" />
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); dispatch(removeNotification(notif.id)) }}
                            className="p-1 text-gray-200 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#CA3433] shrink-0 mt-2.5" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <button
                onClick={() => { dispatch(closeDropdown()); navigate('/notifications') }}
                className="w-full py-3.5 text-center text-sm font-bold text-[#CA3433] border-t border-gray-100 hover:bg-gray-50 transition-colors"
              >
                View All Notifications
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
