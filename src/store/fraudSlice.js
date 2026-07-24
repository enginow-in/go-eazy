import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  fraudAlerts: [],
  blacklistedUsers: [],
  loading: false,
  phoneModalOpen: false,
  idModalOpen: false,
  safetyStats: {
    totalSpamFlagged: 0,
    totalBlacklisted: 0,
    suspiciousTransactions: 0,
    verifiedUsersCount: 0
  }
}

export const fraudSlice = createSlice({
  name: 'fraud',
  initialState,
  reducers: {
    setFraudAlerts: (state, action) => {
      state.fraudAlerts = action.payload
    },
    addFraudAlert: (state, action) => {
      state.fraudAlerts.unshift(action.payload)
    },
    updateFraudAlertStatus: (state, action) => {
      const { id, status } = action.payload
      const item = state.fraudAlerts.find(a => a.id === id)
      if (item) item.status = status
    },
    setBlacklistedUsers: (state, action) => {
      state.blacklistedUsers = action.payload
    },
    addBlacklistedUser: (state, action) => {
      state.blacklistedUsers.push(action.payload)
    },
    removeBlacklistedUser: (state, action) => {
      state.blacklistedUsers = state.blacklistedUsers.filter(u => u.id !== action.payload)
    },
    setPhoneModalOpen: (state, action) => {
      state.phoneModalOpen = action.payload
    },
    setIdModalOpen: (state, action) => {
      state.idModalOpen = action.payload
    },
    setSafetyStats: (state, action) => {
      state.safetyStats = { ...state.safetyStats, ...action.payload }
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    }
  }
})

export const {
  setFraudAlerts,
  addFraudAlert,
  updateFraudAlertStatus,
  setBlacklistedUsers,
  addBlacklistedUser,
  removeBlacklistedUser,
  setPhoneModalOpen,
  setIdModalOpen,
  setSafetyStats,
  setLoading
} = fraudSlice.actions

export default fraudSlice.reducer
