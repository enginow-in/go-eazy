import { createSlice } from '@reduxjs/toolkit'

const defaultPreferences = {
  channels: {
    inApp: true,
    email: true,
    sms: false,
    push: true
  },
  categories: {
    propertyInquiries: true,
    paymentConfirmations: true,
    serviceApprovals: true,
    systemAlerts: true
  },
  frequency: 'instant' // 'instant' | 'daily_digest' | 'weekly_digest' | 'off'
}

const initialNotifications = [
  {
    id: 'notif-1',
    userId: 'demo-user',
    role: 'user',
    type: 'property_inquiry',
    title: 'Property Inquiry Received',
    message: 'Ankit Sharma sent an inquiry regarding 2BHK Luxury Flat in Rajpur Road.',
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    actionUrl: '/messages',
    metadata: { propertyTitle: '2BHK Luxury Flat', senderName: 'Ankit Sharma' }
  },
  {
    id: 'notif-2',
    userId: 'demo-user',
    role: 'user',
    type: 'payment_confirmation',
    title: 'Token Amount Received',
    message: 'Payment of ₹5,000 token amount for Studio Apartment, Clock Tower has been confirmed.',
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actionUrl: '/dashboard',
    metadata: { amount: 5000, transactionId: 'TXN-99201' }
  },
  {
    id: 'notif-3',
    userId: 'demo-user',
    role: 'service_provider',
    type: 'service_approval',
    title: 'Service Listing Approved',
    message: 'Your service "Deep Home Cleaning & Sanitization" has been verified and published.',
    read: true,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    actionUrl: '/service-provider',
    metadata: { serviceName: 'Deep Home Cleaning' }
  },
  {
    id: 'notif-4',
    userId: 'demo-user',
    role: 'admin',
    type: 'system_alert',
    title: 'Platform Maintenance Notice',
    message: 'Scheduled database maintenance on Sunday at 02:00 AM IST. Expect 15 mins down time.',
    read: true,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    actionUrl: null,
    metadata: { scope: 'system' }
  }
]

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: initialNotifications,
    unreadCount: initialNotifications.filter(n => !n.read && !n.archived).length,
    preferences: defaultPreferences,
    filterCategory: 'all', // 'all' | 'inquiries' | 'payments' | 'services' | 'system'
    filterStatus: 'all',   // 'all' | 'unread' | 'archived'
    searchQuery: '',
    loading: false
  },
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload
      state.unreadCount = action.payload.filter(n => !n.read && !n.archived).length
    },
    addNotification: (state, action) => {
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        read: false,
        archived: false,
        createdAt: new Date().toISOString(),
        ...action.payload
      }
      state.items.unshift(newNotif)
      if (!newNotif.read && !newNotif.archived) {
        state.unreadCount += 1
      }
    },
    markAsRead: (state, action) => {
      const item = state.items.find(n => n.id === action.payload)
      if (item && !item.read) {
        item.read = true
        if (state.unreadCount > 0) state.unreadCount -= 1
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(n => {
        n.read = true
      })
      state.unreadCount = 0
    },
    toggleArchive: (state, action) => {
      const item = state.items.find(n => n.id === action.payload)
      if (item) {
        item.archived = !item.archived
        // Recalculate unread count
        state.unreadCount = state.items.filter(n => !n.read && !n.archived).length
      }
    },
    deleteNotification: (state, action) => {
      state.items = state.items.filter(n => n.id !== action.payload)
      state.unreadCount = state.items.filter(n => !n.read && !n.archived).length
    },
    clearAllNotifications: (state) => {
      state.items = []
      state.unreadCount = 0
    },
    updatePreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
        channels: { ...state.preferences.channels, ...(action.payload.channels || {}) },
        categories: { ...state.preferences.categories, ...(action.payload.categories || {}) }
      }
    },
    setFilterCategory: (state, action) => {
      state.filterCategory = action.payload
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    }
  }
})

export const {
  setNotifications,
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
} = notificationSlice.actions

export default notificationSlice.reducer
