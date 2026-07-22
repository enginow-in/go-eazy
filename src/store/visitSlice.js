import { createSlice } from '@reduxjs/toolkit'

const MOCK_VISITS = [
  {
    id: 'visit-1',
    property_id: 'e2fa5154-1506-4b47-9dc4-142f1f582d9f',
    property_title: 'Premium Studio near IT Park',
    user_id: 'dummy-user-123',
    landlord_id: 'landlord-rajesh',
    landlord_name: 'Rajesh Negi',
    visit_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    status: 'approved',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'visit-2',
    property_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    property_title: 'Modern 1BHK in Rishikesh',
    user_id: 'dummy-user-123',
    landlord_id: 'landlord-aisha',
    landlord_name: 'Aisha Bisht',
    visit_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
]

const visitSlice = createSlice({
  name: 'visits',
  initialState: {
    items: MOCK_VISITS,
    loading: false,
  },
  reducers: {
    bookVisit: (state, action) => {
      const { property_id, property_title, landlord_id, landlord_name, visit_date } = action.payload
      state.items.unshift({
        id: `visit-${Date.now()}`,
        property_id,
        property_title,
        user_id: 'dummy-user-123',
        landlord_id,
        landlord_name,
        visit_date,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    },
    updateVisitStatus: (state, action) => {
      const { id, status } = action.payload
      const visit = state.items.find(v => v.id === id)
      if (visit) visit.status = status
    },
    cancelVisit: (state, action) => {
      state.items = state.items.filter(v => v.id !== action.payload)
    },
  },
})

export const { bookVisit, updateVisitStatus, cancelVisit } = visitSlice.actions
export default visitSlice.reducer
