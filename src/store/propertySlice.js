import { createSlice } from '@reduxjs/toolkit'

const defaultFilters = {
  city: '',
  area: '',
  type: '',
  priceMin: 0,
  priceMax: 100000,
  amenities: [],
  query: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
}

const initialState = {
  listings: [],
  featured: [],
  currentProperty: null,
  favorites: [],
  recentlyViewed: [],
  filters: { ...defaultFilters },
  loading: false,
  hasMore: true,
  page: 0,
  totalCount: 0,
  reviews: [],
  reviewsLoading: false,
}

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    setListings: (state, action) => {
      state.listings = Array.isArray(action.payload) ? action.payload : []
    },
    appendListings: (state, action) => {
      const incoming = Array.isArray(action.payload) ? action.payload : []
      state.listings = [...state.listings, ...incoming]
    },
    setFeatured: (state, action) => {
      state.featured = Array.isArray(action.payload) ? action.payload : []
    },
    setCurrentProperty: (state, action) => {
      state.currentProperty = action.payload || null
    },
    setFavorites: (state, action) => {
      state.favorites = Array.isArray(action.payload) ? action.payload : []
    },
    toggleFavorite: (state, action) => {
      const targetId = action.payload
      if (targetId === undefined || targetId === null) return

      const exists = state.favorites.includes(targetId)
      if (exists) {
        state.favorites = state.favorites.filter(id => id !== targetId)
      } else {
        state.favorites.push(targetId)
      }
    },
    setRecentlyViewed: (state, action) => {
      state.recentlyViewed = Array.isArray(action.payload) ? action.payload : []
    },
    addRecentlyViewed: (state, action) => {
      const targetId = action.payload
      if (!targetId) return
      
      state.recentlyViewed = [
        targetId,
        ...state.recentlyViewed.filter(id => id !== targetId)
      ].slice(0, 20)
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.page = 0
      state.listings = []
    },
    resetFilters: (state) => {
      state.filters = { ...defaultFilters }
      state.page = 0
      state.listings = []
    },
    setLoading: (state, action) => { 
      state.loading = Boolean(action.payload) 
    },
    setHasMore: (state, action) => { 
      state.hasMore = Boolean(action.payload) 
    },
    setPage: (state, action) => { 
      state.page = typeof action.payload === 'number' ? action.payload : 0 
    },
    setTotalCount: (state, action) => { 
      state.totalCount = typeof action.payload === 'number' ? action.payload : 0 
    },
    setReviews: (state, action) => {
      state.reviews = Array.isArray(action.payload) ? action.payload : []
    },
    addReview: (state, action) => {
      const incomingReview = action.payload
      if (!incomingReview?.id) return

      const index = state.reviews.findIndex(r => r.id === incomingReview.id)
      if (index >= 0) {
        state.reviews[index] = { ...state.reviews[index], ...incomingReview }
      } else {
        state.reviews.unshift(incomingReview)
      }
    },
    removeReview: (state, action) => {
      state.reviews = state.reviews.filter(r => r.id !== action.payload)
    },
    setReviewsLoading: (state, action) => {
      state.reviewsLoading = Boolean(action.payload)
    },
  },
})

export const {
  setListings, appendListings, setFeatured, setCurrentProperty,
  setFavorites, toggleFavorite, setRecentlyViewed, addRecentlyViewed,
  setFilters, resetFilters, setLoading, setHasMore, setPage, setTotalCount,
  setReviews, addReview, removeReview, setReviewsLoading
} = propertySlice.actions

export default propertySlice.reducer