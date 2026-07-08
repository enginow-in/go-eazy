import { createSlice } from '@reduxjs/toolkit'

const serviceSlice = createSlice({
  name: 'service',
  initialState: {
    services: [],
    currentService: null,
    reviews: [],
    filters: {
      category: '',
      city: '',
      state: '',
      area: '',
      query: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
    loading: false,
    reviewsLoading: false,
    hasMore: true,
    page: 0,
  },
  reducers: {
    setServices: (state, action) => {
      state.services = action.payload
    },
    appendServices: (state, action) => {
      state.services = [...state.services, ...action.payload]
    },
    setCurrentService: (state, action) => {
      state.currentService = action.payload
    },
    setReviews: (state, action) => {
      state.reviews = action.payload
    },
    addReview: (state, action) => {
      // Remove existing review from same user if exists, then add new one
      const existing = state.reviews.findIndex(r => r.reviewer_id === action.payload.reviewer_id)
      if (existing >= 0) state.reviews[existing] = action.payload
      else state.reviews.unshift(action.payload)
    },
    removeReview: (state, action) => {
      state.reviews = state.reviews.filter(r => r.id !== action.payload)
    },
    setServiceFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.page = 0
      state.services = []
      state.hasMore = true // Fix: Unlock pagination for new filter context
    },
    resetServiceFilters: (state) => {
      state.filters = { 
        category: '', 
        city: '', 
        state: '', 
        area: '', 
        query: '',
        sortBy: 'created_at',
        sortOrder: 'desc'
      }
      state.page = 0
      state.services = []
      state.hasMore = true // Fix: Unlock pagination for new filter context
    },
    setServiceLoading: (state, action) => { state.loading = action.payload },
    setReviewsLoading: (state, action) => { state.reviewsLoading = action.payload },
    setServiceHasMore: (state, action) => { state.hasMore = action.payload },
    setServicePage: (state, action) => { state.page = action.payload },
  },
})

export const {
  setServices, appendServices, setCurrentService,
  setReviews, addReview, removeReview,
  setServiceFilters, resetServiceFilters,
  setServiceLoading, setReviewsLoading, setServiceHasMore, setServicePage,
} = serviceSlice.actions

export default serviceSlice.reducer