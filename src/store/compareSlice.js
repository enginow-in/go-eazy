import { createSlice } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'

const MAX_COMPARE_LIMIT = 4

const initialState = {
  comparedIds: [],
  isModalOpen: false
}

const compareSlice = createSlice({
  name: 'compare',
  initialState,
  reducers: {
    toggleCompare: (state, action) => {
      const id = action.payload
      const exists = state.comparedIds.includes(id)
      if (exists) {
        state.comparedIds = state.comparedIds.filter(item => item !== id)
        toast.success('Removed from comparison')
      } else {
        if (state.comparedIds.length >= MAX_COMPARE_LIMIT) {
          toast.error(`You can compare up to ${MAX_COMPARE_LIMIT} properties at a time`)
          return
        }
        state.comparedIds.push(id)
        toast.success('Added to comparison matrix!')
      }
    },
    removeFromCompare: (state, action) => {
      state.comparedIds = state.comparedIds.filter(id => id !== action.payload)
    },
    clearCompare: (state) => {
      state.comparedIds = []
      state.isModalOpen = false
    },
    setCompareModalOpen: (state, action) => {
      state.isModalOpen = Boolean(action.payload)
    }
  }
})

export const {
  toggleCompare,
  removeFromCompare,
  clearCompare,
  setCompareModalOpen
} = compareSlice.actions

export default compareSlice.reducer
