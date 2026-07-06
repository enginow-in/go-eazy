import { describe, it, expect } from 'vitest'
import reducer, {
  setListings, appendListings, toggleFavorite, addRecentlyViewed,
  setFilters, resetFilters, addReview, removeReview,
} from './propertySlice'

const init = () => reducer(undefined, { type: '@@INIT' })

describe('propertySlice reducer', () => {
  it('starts with sensible defaults', () => {
    const state = init()
    expect(state.listings).toEqual([])
    expect(state.filters.priceMax).toBe(100000)
    expect(state.page).toBe(0)
  })

  it('setListings replaces the list', () => {
    const state = reducer(init(), setListings([{ id: 1 }]))
    expect(state.listings).toEqual([{ id: 1 }])
  })

  it('appendListings adds to the existing list', () => {
    let state = reducer(init(), setListings([{ id: 1 }]))
    state = reducer(state, appendListings([{ id: 2 }]))
    expect(state.listings.map(p => p.id)).toEqual([1, 2])
  })

  describe('toggleFavorite', () => {
    it('adds an id that is not there yet', () => {
      const state = reducer(init(), toggleFavorite('abc'))
      expect(state.favorites).toContain('abc')
    })

    it('removes an id that is already there', () => {
      let state = reducer(init(), toggleFavorite('abc'))
      state = reducer(state, toggleFavorite('abc'))
      expect(state.favorites).not.toContain('abc')
    })
  })

  describe('addRecentlyViewed', () => {
    it('puts the newest id first and de-duplicates', () => {
      let state = reducer(init(), addRecentlyViewed('a'))
      state = reducer(state, addRecentlyViewed('b'))
      state = reducer(state, addRecentlyViewed('a'))
      expect(state.recentlyViewed).toEqual(['a', 'b'])
    })

    it('caps the list at 20 entries', () => {
      let state = init()
      for (let i = 0; i < 25; i++) {
        state = reducer(state, addRecentlyViewed(`id-${i}`))
      }
      expect(state.recentlyViewed).toHaveLength(20)
      expect(state.recentlyViewed[0]).toBe('id-24')
    })
  })

  describe('setFilters', () => {
    it('merges new filters and resets pagination', () => {
      let state = reducer(init(), setListings([{ id: 1 }]))
      state = reducer(state, setFilters({ city: 'Dehradun', page: 3 }))
      expect(state.filters.city).toBe('Dehradun')
      // untouched defaults survive the merge
      expect(state.filters.priceMax).toBe(100000)
      // changing filters must clear the current page of results
      expect(state.page).toBe(0)
      expect(state.listings).toEqual([])
    })
  })

  it('resetFilters restores the defaults', () => {
    let state = reducer(init(), setFilters({ city: 'Dehradun', type: 'PG' }))
    state = reducer(state, resetFilters())
    expect(state.filters.city).toBe('')
    expect(state.filters.type).toBe('')
  })

  describe('reviews', () => {
    it('addReview prepends a new review', () => {
      const state = reducer(init(), addReview({ id: 'r1', rating: 5 }))
      expect(state.reviews[0]).toEqual({ id: 'r1', rating: 5 })
    })

    it('addReview updates an existing review instead of duplicating', () => {
      let state = reducer(init(), addReview({ id: 'r1', rating: 5 }))
      state = reducer(state, addReview({ id: 'r1', rating: 2 }))
      expect(state.reviews).toHaveLength(1)
      expect(state.reviews[0].rating).toBe(2)
    })

    it('removeReview drops the matching review', () => {
      let state = reducer(init(), addReview({ id: 'r1', rating: 5 }))
      state = reducer(state, removeReview('r1'))
      expect(state.reviews).toHaveLength(0)
    })
  })
})
