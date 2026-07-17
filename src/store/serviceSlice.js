import { createSlice } from '@reduxjs/toolkit'

const defaultFilters = {
  category: '', 
  city: '', 
  state: '', 
  area: '', 
  query: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
}

const initialState = {
  services: [],
  currentService: null,
  reviews: [],
  filters: { ...defaultFilters },
  loading: false,
  reviewsLoading: false,
  hasMore: true,
  page: 0,
}

const serviceSlice = createSlice({
  name: 'service',
  initialState,
  reducers: {
    setServices: (state, action) => {
      state.services = Array.isArray(action.payload) ? action.payload : []
    },
    appendServices: (state, action) => {
      const incoming = Array.isArray(action.payload) ? action.payload : []
      state.services = [...state.services, ...incoming]
    },
    setCurrentService: (state, action) => {
      state.currentService = action.payload || null
    },
    setReviews: (state, action) => {
      state.reviews = Array.isArray(action.payload) ? action.payload : []
    },
    addReview: (state, action) => {
      const incomingReview = action.payload
      if (!incomingReview?.reviewer_id) return

      // Remove existing review from same user if exists, then add new one safely
      const existingIdx = state.reviews.findIndex(r => r.reviewer_id === incomingReview.reviewer_id)
      if (existingIdx >= 0) {
        state.reviews[existingIdx] = { ...state.reviews[existingIdx], ...incomingReview }
      } else {
        state.reviews.unshift(incomingReview)
      }
    },
    removeReview: (state, action) => {
      state.reviews = state.reviews.filter(r => r.id !== action.payload)
    },
    setServiceFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.page = 0
      state.services = []
    },
    resetServiceFilters: (state) => {
      state.filters = { ...defaultFilters }
      state.page = 0
      state.services = []
    },
    setServiceLoading: (state, action) => { 
      state.loading = Boolean(action.payload) 
    },
    setReviewsLoading: (state, action) => { 
      state.reviewsLoading = Boolean(action.payload) 
    },
    setServiceHasMore: (state, action) => { 
      state.hasMore = Boolean(action.payload) 
    },
    setServicePage: (state, action) => { 
      state.page = typeof action.payload === 'number' ? action.payload : 0 
    },
  },
})

export const {
  setServices, appendServices, setCurrentService,
  setReviews, addReview, removeReview,
  setServiceFilters, resetServiceFilters,
  setServiceLoading, setReviewsLoading, setServiceHasMore, setServicePage,
} = serviceSlice.actions

export default serviceSlice.reducer