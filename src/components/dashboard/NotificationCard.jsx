import React from 'react'
import { Bell, TrendingDown, MessageCircle, CheckCircle, Home, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const NotificationIcon = ({ type }) => {
  const icons = {
    price_drop: TrendingDown,
    message: MessageCircle,
    booking: CheckCircle,
    property: Home,
    default: Bell
  }
  const Icon = icons[type] || icons.default
  return <Icon size={16} />
}

export const NotificationCard = ({ notification, onDismiss }) => {
  const getNotificationColor = (type) => {
    const colors = {
      price_drop: 'bg-green-50 text-green-700 border-green-200',
      message: 'bg-blue-50 text-blue-700 border-blue-200',
      booking: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      property: 'bg-purple-50 text-purple-700 border-purple-200',
      default: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return colors[type] || colors.default
  }

  return (
    <div className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} relative group`}>
      <button
        onClick={() => onDismiss(notification.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 rounded"
      >
        <X size={14} />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <NotificationIcon type={notification.type} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
          <p className="text-sm opacity-90 mb-2">{notification.message}</p>
          <span className="text-xs opacity-70">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  )
}