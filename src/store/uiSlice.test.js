import { describe, it, expect } from 'vitest'
import reducer, {
  toggleMobileMenu, closeMobileMenu, setSearchOpen, setActiveCategory,
} from './uiSlice'

const init = () => reducer(undefined, { type: '@@INIT' })

describe('uiSlice reducer', () => {
  it('mobile menu starts closed', () => {
    expect(init().mobileMenuOpen).toBe(false)
  })

  it('toggleMobileMenu flips the flag back and forth', () => {
    let state = reducer(init(), toggleMobileMenu())
    expect(state.mobileMenuOpen).toBe(true)
    state = reducer(state, toggleMobileMenu())
    expect(state.mobileMenuOpen).toBe(false)
  })

  it('closeMobileMenu always closes it', () => {
    let state = reducer(init(), toggleMobileMenu())
    state = reducer(state, closeMobileMenu())
    expect(state.mobileMenuOpen).toBe(false)
  })

  it('setSearchOpen and setActiveCategory store their payloads', () => {
    let state = reducer(init(), setSearchOpen(true))
    expect(state.searchOpen).toBe(true)
    state = reducer(state, setActiveCategory('PG'))
    expect(state.activeCategory).toBe('PG')
  })
})
