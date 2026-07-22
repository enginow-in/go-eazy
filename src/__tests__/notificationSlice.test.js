import reducer, { markAsRead, markAllAsRead, addNotification, removeNotification, clearAll } from '../store/notificationSlice'

describe('notificationSlice', () => {
  const initialState = {
    items: [
      { id: 'n1', message: 'Test 1', is_read: false, created_at: new Date().toISOString(), type: 'new_message', link: null },
      { id: 'n2', message: 'Test 2', is_read: true, created_at: new Date().toISOString(), type: 'payment_success', link: null },
    ],
    unreadCount: 1,
    dropdownOpen: false,
  }

  it('marks a notification as read', () => {
    const state = reducer(initialState, markAsRead('n1'))
    expect(state.items.find(n => n.id === 'n1').is_read).toBe(true)
    expect(state.unreadCount).toBe(0)
  })

  it('marks all as read', () => {
    const state = reducer(initialState, markAllAsRead())
    expect(state.items.every(n => n.is_read)).toBe(true)
    expect(state.unreadCount).toBe(0)
  })

  it('adds a notification', () => {
    const notif = { id: 'n3', message: 'New', is_read: false, created_at: new Date().toISOString(), type: 'visit_approved', link: null }
    const state = reducer(initialState, addNotification(notif))
    expect(state.items).toHaveLength(3)
    expect(state.items[0].id).toBe('n3')
    expect(state.unreadCount).toBe(2)
  })

  it('removes a notification', () => {
    const state = reducer(initialState, removeNotification('n1'))
    expect(state.items).toHaveLength(1)
    expect(state.items[0].id).toBe('n2')
    expect(state.unreadCount).toBe(0)
  })

  it('clears all notifications', () => {
    const state = reducer(initialState, clearAll())
    expect(state.items).toHaveLength(0)
    expect(state.unreadCount).toBe(0)
  })
})
