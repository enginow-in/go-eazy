import { createSlice } from '@reduxjs/toolkit'

const propertySlice = createSlice({
  name: 'property',
  initialState: {
    listings: [],
    featured: [],
    currentProperty: null,
    favorites: [],
    recentlyViewed: [],
    filters: {
      city: '',
      area: '',
      type: '',
      priceMin: 0,
      priceMax: 100000,
      amenities: [],
      query: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
    loading: false,
    fetching: false,
requestId: null,
    hasMore: true,
    page: 0,
    totalCount: 0,
    reviews: [],
    reviewsLoading: false,
  },
  reducers: {
    setListings: (state, action) => {
      state.listings = action.payload
    },
    appendListings: (state, action) => {
      state.listings = [...state.listings, ...action.payload]
    },
    setFeatured: (state, action) => {
      state.featured = action.payload
    },
    setCurrentProperty: (state, action) => {
      state.currentProperty = action.payload
    },
    setFavorites: (state, action) => {
      state.favorites = action.payload
    },
    toggleFavorite: (state, action) => {
      const id = action.payload
      const idx = state.favorites.indexOf(id)
      if (idx >= 0) state.favorites.splice(idx, 1)
      else state.favorites.push(id)
    },
    setRecentlyViewed: (state, action) => {
      state.recentlyViewed = action.payload
    },
    addRecentlyViewed: (state, action) => {
      const id = action.payload
      state.recentlyViewed = [id, ...state.recentlyViewed.filter(i => i !== id)].slice(0, 20)
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.page = 0
      state.listings = []
    },
    resetFilters: (state) => {
      state.filters = {
        city: '', area: '', type: '',
        priceMin: 0, priceMax: 100000,
        amenities: [], query: '', sortBy: 'created_at', sortOrder: 'desc',
      }
      state.page = 0
      state.listings = []
    },
    setLoading: (state, action) => { state.loading = action.payload },
    setFetching: (state, action) => {
    state.fetching = action.payload
},

setRequestId: (state, action) => {
    state.requestId = action.payload
},
    setHasMore: (state, action) => { state.hasMore = action.payload },
    setPage: (state, action) => { state.page = action.payload },
    setTotalCount: (state, action) => { state.totalCount = action.payload },
    setReviews: (state, action) => {
      state.reviews = action.payload
    },
    addReview: (state, action) => {
      const review = action.payload
      const index = state.reviews.findIndex(r => r.id === review.id)
      if (index >= 0) state.reviews[index] = review
      else state.reviews.unshift(review)
    },
    removeReview: (state, action) => {
      state.reviews = state.reviews.filter(r => r.id !== action.payload)
    },
    setReviewsLoading: (state, action) => {
      state.reviewsLoading = action.payload
    },
  },
})

export const {
  setListings,
  appendListings,
  setFeatured,
  setCurrentProperty,
  setFavorites,
  toggleFavorite,
  setRecentlyViewed,
  addRecentlyViewed,
  setFilters,
  resetFilters,
  setLoading,
  setFetching,
  setRequestId,
  setHasMore,
  setPage,
  setTotalCount,
  setReviews,
  addReview,
  removeReview,
  setReviewsLoading,
} = propertySlice.actions
export default propertySlice.reducer
