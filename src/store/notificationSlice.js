import { createSlice } from '@reduxjs/toolkit'

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    message: 'Your site visit for Premium Studio near IT Park has been approved!',
    is_read: false,
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    type: 'visit_approved',
    link: '/property/e2fa5154-1506-4b47-9dc4-142f1f582d9f',
  },
  {
    id: 'notif-2',
    message: 'New message from Rajesh Negi regarding Premium Studio near IT Park.',
    is_read: false,
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    type: 'new_message',
    link: '/messages',
  },
  {
    id: 'notif-3',
    message: 'A new property matching your saved search "Flats in Dehradun" has been listed!',
    is_read: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    type: 'search_match',
    link: '/search?city=Dehradun&type=Flat',
  },
  {
    id: 'notif-4',
    message: 'Your payment of ₹9 for unlocking contact details was successful.',
    is_read: true,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    type: 'payment_success',
    link: null,
  },
]

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: MOCK_NOTIFICATIONS,
    unreadCount: MOCK_NOTIFICATIONS.filter(n => !n.is_read).length,
    dropdownOpen: false,
  },
  reducers: {
    toggleDropdown: (state) => {
      state.dropdownOpen = !state.dropdownOpen
    },
    openDropdown: (state) => {
      state.dropdownOpen = true
    },
    closeDropdown: (state) => {
      state.dropdownOpen = false
    },
    markAsRead: (state, action) => {
      const notif = state.items.find(n => n.id === action.payload)
      if (notif && !notif.is_read) {
        notif.is_read = true
        state.unreadCount = state.items.filter(n => !n.is_read).length
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(n => { n.is_read = true })
      state.unreadCount = 0
    },
    addNotification: (state, action) => {
      state.items.unshift(action.payload)
      state.unreadCount = state.items.filter(n => !n.is_read).length
    },
    removeNotification: (state, action) => {
      state.items = state.items.filter(n => n.id !== action.payload)
      state.unreadCount = state.items.filter(n => !n.is_read).length
    },
    clearAll: (state) => {
      state.items = []
      state.unreadCount = 0
    },
  },
})

export const {
  toggleDropdown, openDropdown, closeDropdown,
  markAsRead, markAllAsRead, addNotification,
  removeNotification, clearAll,
} = notificationSlice.actions
export default notificationSlice.reducer
