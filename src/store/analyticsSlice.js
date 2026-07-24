import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  timeframe: '30d', // '7d' | '30d' | '90d' | 'all'
  isPremiumAnalyticsUnlocked: true, // Pro tier status
  events: [],
  loading: false,
  activeHeatmapPropertyId: null,
}

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setTimeframe: (state, action) => {
      state.timeframe = action.payload
    },
    setEvents: (state, action) => {
      state.events = action.payload
    },
    addEvent: (state, action) => {
      state.events.unshift(action.payload)
    },
    setActiveHeatmapPropertyId: (state, action) => {
      state.activeHeatmapPropertyId = action.payload
    },
    togglePremiumAnalytics: (state, action) => {
      state.isPremiumAnalyticsUnlocked = action.payload ?? !state.isPremiumAnalyticsUnlocked
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    }
  }
})

export const {
  setTimeframe,
  setEvents,
  addEvent,
  setActiveHeatmapPropertyId,
  togglePremiumAnalytics,
  setLoading
} = analyticsSlice.actions

export default analyticsSlice.reducer
