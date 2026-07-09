import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../lib/supabase'

export const fetchNegotiation = createAsyncThunk(
  'negotiation/fetch',
  async ({ propertyId, tenantId, landlordId }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('negotiations')
        .select('*')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId)
        .eq('landlord_id', landlordId)
        .single()
        
      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const proposePrice = createAsyncThunk(
  'negotiation/propose',
  async ({ propertyId, tenantId, landlordId, price }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('negotiations')
        .insert({
          property_id: propertyId,
          tenant_id: tenantId,
          landlord_id: landlordId,
          current_price: price,
          status: 'proposed',
          last_actor_id: tenantId
        })
        .select()
        .single()
        
      if (error) throw error
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const respondToNegotiation = createAsyncThunk(
  'negotiation/respond',
  async ({ id, action, price, actorId }, { rejectWithValue }) => {
    try {
      const updates = {
        last_actor_id: actorId,
        updated_at: new Date().toISOString()
      }
      
      if (action === 'accept') updates.status = 'accepted'
      else if (action === 'reject') updates.status = 'rejected'
      else if (action === 'counter') {
        updates.status = 'countered'
        updates.current_price = price
      }

      const { data, error } = await supabase
        .from('negotiations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
        
      if (error) throw error
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  currentNegotiation: null,
  loading: false,
  error: null
}

const negotiationSlice = createSlice({
  name: 'negotiation',
  initialState,
  reducers: {
    setNegotiation: (state, action) => {
      state.currentNegotiation = action.payload
    },
    clearNegotiation: (state) => {
      state.currentNegotiation = null
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNegotiation.pending, (state) => { state.loading = true })
      .addCase(fetchNegotiation.fulfilled, (state, action) => {
        state.loading = false
        state.currentNegotiation = action.payload
      })
      .addCase(fetchNegotiation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      .addCase(proposePrice.pending, (state) => { state.loading = true })
      .addCase(proposePrice.fulfilled, (state, action) => {
        state.loading = false
        state.currentNegotiation = action.payload
      })
      .addCase(proposePrice.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(respondToNegotiation.pending, (state) => { state.loading = true })
      .addCase(respondToNegotiation.fulfilled, (state, action) => {
        state.loading = false
        state.currentNegotiation = action.payload
      })
      .addCase(respondToNegotiation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { setNegotiation, clearNegotiation } = negotiationSlice.actions
export default negotiationSlice.reducer
