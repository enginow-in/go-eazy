import { describe, it, expect } from 'vitest'
import { formatPrice, formatPriceShort, truncate, getInitials, cn } from './helpers'

describe('formatPrice', () => {
  it('formats a number as INR with no decimals', () => {
    const out = formatPrice(5000)
    expect(out).toContain('5,000')
    expect(out).toContain('₹')
    expect(out).not.toContain('.')
  })

  it('handles zero as a real value, not empty', () => {
    expect(formatPrice(0)).toContain('0')
  })

  it('returns a dash for null or undefined', () => {
    expect(formatPrice(null)).toBe('—')
    expect(formatPrice(undefined)).toBe('—')
  })
})

describe('formatPriceShort', () => {
  it('shortens lakhs with one decimal', () => {
    expect(formatPriceShort(150000)).toBe('₹1.5L')
  })

  it('shortens thousands with no decimal', () => {
    expect(formatPriceShort(5000)).toBe('₹5K')
  })

  it('leaves small values as is', () => {
    expect(formatPriceShort(500)).toBe('₹500')
  })

  it('returns a dash for falsy input', () => {
    expect(formatPriceShort(0)).toBe('—')
    expect(formatPriceShort(null)).toBe('—')
  })
})

describe('truncate', () => {
  it('cuts long strings and adds an ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello…')
  })

  it('leaves short strings untouched', () => {
    expect(truncate('hi', 80)).toBe('hi')
  })

  it('returns falsy input unchanged', () => {
    expect(truncate('')).toBe('')
    expect(truncate(undefined)).toBe(undefined)
  })
})

describe('getInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('john middle doe')).toBe('JM')
  })

  it('works with a single name', () => {
    expect(getInitials('alice')).toBe('A')
  })

  it('returns an empty string for no name', () => {
    expect(getInitials('')).toBe('')
    expect(getInitials()).toBe('')
  })
})

describe('cn', () => {
  it('joins truthy class names with a space', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
  })
})
