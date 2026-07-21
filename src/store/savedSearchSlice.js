import { createSlice } from '@reduxjs/toolkit'
import { MOCK_SAVED_SEARCHES } from '../utils/constants'

const savedSearchSlice = createSlice({
  name: 'savedSearch',
  initialState: {
    searches: MOCK_SAVED_SEARCHES,
    matchingAlerts: [],
  },
  reducers: {
    addSavedSearch: (state, action) => {
      state.searches.unshift({
        id: `ss-${Date.now()}`,
        ...action.payload,
        createdAt: new Date().toISOString().split('T')[0],
      })
    },
    removeSavedSearch: (state, action) => {
      state.searches = state.searches.filter(s => s.id !== action.payload)
    },
    toggleNotifyOnMatch: (state, action) => {
      const search = state.searches.find(s => s.id === action.payload)
      if (search) search.notifyOnMatch = !search.notifyOnMatch
    },
    addMatchingAlert: (state, action) => {
      state.matchingAlerts.unshift({
        id: `alert-${Date.now()}`,
        ...action.payload,
        read: false,
        createdAt: new Date().toISOString(),
      })
    },
    markAlertRead: (state, action) => {
      const alert = state.matchingAlerts.find(a => a.id === action.payload)
      if (alert) alert.read = true
    },
    clearAlerts: (state) => {
      state.matchingAlerts = []
    },
  },
})

export const {
  addSavedSearch, removeSavedSearch, toggleNotifyOnMatch,
  addMatchingAlert, markAlertRead, clearAlerts,
} = savedSearchSlice.actions
export default savedSearchSlice.reducer
