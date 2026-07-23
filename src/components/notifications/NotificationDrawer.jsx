import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Trash2, ArrowRight, MessageSquare, CreditCard, ShieldCheck, AlertTriangle, ExternalLink, Inbox } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteItem,
    clearAll
  } = useNotifications()

  if (!isOpen) return null

  const getIcon = (type) => {
    switch (type) {
      case 'property_inquiry':
        return <MessageSquare size={16} className="text-blue-500" />
      case 'payment_confirmation':
        return <CreditCard size={16} className="text-emerald-500" />
      case 'service_approval':
        return <ShieldCheck size={16} className="text-amber-500" />
      case 'system_alert':
      default:
        return <AlertTriangle size={16} className="text-purple-500" />
    }
  }

  const unreadItems = notifications.filter(n => !n.read && !n.archived)
  const displayItems = unreadItems.length > 0 ? unreadItems.slice(0, 6) : notifications.filter(n => !n.archived).slice(0, 6)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popover Card */}
      <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CA3433] flex items-center justify-center shadow-sm">
              <Bell size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display leading-tight">Notifications</h3>
              <p className="text-[11px] text-gray-300">
                {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                title="Mark all as read"
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold flex items-center gap-1"
              >
                <CheckCheck size={14} />
                <span className="hidden sm:inline">Read all</span>
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50 scrollbar-thin">
          {displayItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <Inbox size={22} />
              </div>
              <p className="text-sm font-semibold text-gray-700">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">We'll alert you when inquiries, payments, or approvals arrive.</p>
            </div>
          ) : (
            displayItems.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) markRead(n.id)
                  if (n.actionUrl) {
                    navigate(n.actionUrl)
                    onClose()
                  }
                }}
                className={`p-4 transition-all hover:bg-gray-50/80 cursor-pointer relative group flex gap-3.5 items-start ${!n.read ? 'bg-[#fff5f5]/60' : ''}`}
              >
                {!n.read && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#CA3433] ring-4 ring-[#fff5f5]" />
                )}

                <div className="p-2 rounded-xl bg-gray-100/80 group-hover:bg-white transition-colors shrink-0 mt-0.5 shadow-2xs">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{n.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{n.message}</p>
                  
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100/60">
                    <span className="text-[10px] font-medium text-gray-400">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>

                    {n.actionUrl && (
                      <span className="text-[10px] font-bold text-[#CA3433] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        View details <ExternalLink size={10} />
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteItem(n.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all"
                  title="Remove notification"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-gray-500 hover:text-red-600 font-semibold px-2 py-1 transition-colors"
            >
              Clear all
            </button>
          )}

          <Link
            to="/notifications"
            onClick={onClose}
            className="ml-auto font-bold text-[#CA3433] hover:text-[#ac2d2c] flex items-center gap-1 px-3 py-1.5 bg-[#fff5f5] rounded-xl hover:bg-[#ffebeb] transition-colors"
          >
            Notification History <ArrowRight size={13} />
          </Link>
        </div>

      </div>
    </>
  )
}
