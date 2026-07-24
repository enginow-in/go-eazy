import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  CheckCheck,
  Trash2,
  Archive,
  Filter,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Inbox,
  Clock,
  Send,
  SlidersHorizontal
} from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'

export const NotificationHistory = () => {
  const navigate = useNavigate()
  const {
    notifications,
    filteredNotifications,
    unreadCount,
    filterCategory,
    filterStatus,
    searchQuery,
    markRead,
    markAllRead,
    archiveItem,
    deleteItem,
    clearAll,
    setCategoryFilter,
    setStatusFilter,
    setSearch,
    sendNotification
  } = useNotifications()

  const getIcon = (type) => {
    switch (type) {
      case 'property_inquiry':
        return <MessageSquare size={18} className="text-blue-500" />
      case 'payment_confirmation':
        return <CreditCard size={18} className="text-emerald-500" />
      case 'service_approval':
        return <ShieldCheck size={18} className="text-amber-500" />
      case 'system_alert':
      default:
        return <AlertTriangle size={18} className="text-purple-500" />
    }
  }

  const categoryTabs = [
    { id: 'all', label: 'All Updates', count: notifications.filter(n => !n.archived).length },
    { id: 'inquiries', label: 'Inquiries', count: notifications.filter(n => n.type === 'property_inquiry' && !n.archived).length },
    { id: 'payments', label: 'Payments', count: notifications.filter(n => n.type === 'payment_confirmation' && !n.archived).length },
    { id: 'services', label: 'Services', count: notifications.filter(n => n.type === 'service_approval' && !n.archived).length },
    { id: 'system', label: 'System', count: notifications.filter(n => n.type === 'system_alert' && !n.archived).length },
  ]

  const handleTestDemoNotification = () => {
    const testTypes = [
      {
        type: 'property_inquiry',
        title: 'New Visit Request',
        message: 'Rohan Mehta requested a site visit for 3BHK Penthouse in Clement Town.',
        actionUrl: '/messages'
      },
      {
        type: 'payment_confirmation',
        title: 'Rent Deposit Confirmed',
        message: 'Payment of ₹12,000 rent deposit for July 2026 was successfully recorded.',
        actionUrl: '/dashboard'
      },
      {
        type: 'service_approval',
        title: 'Plumbing Service Approved',
        message: 'Your service booking #SERV-402 has been confirmed by provider.',
        actionUrl: '/nearby'
      }
    ]
    const randomItem = testTypes[Math.floor(Math.random() * testTypes.length)]
    sendNotification(randomItem)
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-6 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Banner */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-[#CA3433] rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                  <Bell size={24} className="text-[#CA3433]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#CA3433] bg-white/90 px-3 py-1 rounded-full">
                  Notification Center
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight">Notification History & Archive</h1>
              <p className="text-xs sm:text-sm text-gray-200 mt-1 max-w-xl">
                Stay updated with real-time property inquiries, payment confirmations, service provider approvals, and system alerts.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleTestDemoNotification}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              >
                <Send size={14} /> Trigger Demo Alert
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="px-4 py-2.5 rounded-xl bg-[#CA3433] hover:bg-[#ac2d2c] text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-[#CA3433]/30 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCheck size={14} /> Mark All Read ({unreadCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Bell size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 font-display">{notifications.length}</p>
              <p className="text-xs font-semibold text-gray-500">Total Notifications</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#fff5f5] text-[#CA3433] flex items-center justify-center font-bold">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 font-display">{unreadCount}</p>
              <p className="text-xs font-semibold text-gray-500">Unread Updates</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Archive size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 font-display">
                {notifications.filter(n => n.archived).length}
              </p>
              <p className="text-xs font-semibold text-gray-500">Archived Items</p>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto scrollbar-none pb-2 md:pb-0">
            {categoryTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${filterCategory === tab.id ? 'bg-[#CA3433] text-white shadow-md shadow-[#CA3433]/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filterCategory === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] outline-none"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-[#CA3433]/20 outline-none cursor-pointer"
            >
              <option value="all">Active Items</option>
              <option value="unread">Unread Only</option>
              <option value="archived">Archived Items</option>
            </select>
          </div>
        </div>

        {/* List Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </span>

            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <Trash2 size={13} /> Clear all history
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
                  <Inbox size={28} />
                </div>
                <h3 className="text-sm font-bold text-gray-800">No matching notifications</h3>
                <p className="text-xs text-gray-400 mt-1">Try switching filters or clearing your search query.</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-5 sm:p-6 transition-all hover:bg-gray-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative group ${!n.read ? 'bg-[#fff5f5]/50' : ''}`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-3 rounded-2xl bg-gray-100/80 shrink-0 shadow-2xs">
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{n.title}</h3>
                        {!n.read && (
                          <span className="px-2 py-0.5 bg-[#CA3433] text-white text-[10px] font-bold rounded-full">
                            New
                          </span>
                        )}
                        {n.archived && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-full">
                            Archived
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed mb-2">{n.message}</p>

                      <div className="flex items-center gap-4 text-[11px] text-gray-400 font-medium">
                        <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                        <span>•</span>
                        <span className="capitalize">{n.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {n.actionUrl && (
                      <button
                        onClick={() => {
                          if (!n.read) markRead(n.id)
                          navigate(n.actionUrl)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#fff5f5] hover:bg-[#ffebeb] text-[#CA3433] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        Action <ExternalLink size={12} />
                      </button>
                    )}

                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck size={16} />
                      </button>
                    )}

                    <button
                      onClick={() => archiveItem(n.id)}
                      className={`p-2 rounded-xl transition-colors ${n.archived ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                      title={n.archived ? 'Unarchive' : 'Archive'}
                    >
                      <Archive size={16} />
                    </button>

                    <button
                      onClick={() => deleteItem(n.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
