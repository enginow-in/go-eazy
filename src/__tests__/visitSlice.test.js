import reducer, { bookVisit, updateVisitStatus, cancelVisit } from '../store/visitSlice'

describe('visitSlice', () => {
  const initialState = {
    items: [],
    loading: false,
  }

  it('books a visit', () => {
    const state = reducer(initialState, bookVisit({
      property_id: 'p1',
      property_title: 'Test Property',
      landlord_id: 'l1',
      landlord_name: 'Landlord',
      visit_date: '2026-08-01',
    }))
    expect(state.items).toHaveLength(1)
    expect(state.items[0].property_id).toBe('p1')
    expect(state.items[0].status).toBe('pending')
  })

  it('updates visit status', () => {
    const withVisit = reducer(initialState, bookVisit({
      property_id: 'p1',
      property_title: 'Test',
      landlord_id: 'l1',
      landlord_name: 'Landlord',
      visit_date: '2026-08-01',
    }))
    const visitId = withVisit.items[0].id
    const state = reducer(withVisit, updateVisitStatus({ id: visitId, status: 'approved' }))
    expect(state.items[0].status).toBe('approved')
  })

  it('cancels a visit', () => {
    const withVisit = reducer(initialState, bookVisit({
      property_id: 'p1',
      property_title: 'Test',
      landlord_id: 'l1',
      landlord_name: 'Landlord',
      visit_date: '2026-08-01',
    }))
    const visitId = withVisit.items[0].id
    const state = reducer(withVisit, cancelVisit(visitId))
    expect(state.items).toHaveLength(0)
  })
})
