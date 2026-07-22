import { formatPrice, formatPriceShort, truncate, getInitials, getTimeAgo, getFurnishingLabel, filterProperties } from '../utils/helpers'

describe('formatPrice', () => {
  it('formats INR prices', () => {
    expect(formatPrice(18000)).toBe('₹18,000')
    expect(formatPrice(0)).toBe('₹0')
  })
  it('returns — for null/undefined', () => {
    expect(formatPrice(null)).toBe('—')
    expect(formatPrice(undefined)).toBe('—')
  })
})

describe('formatPriceShort', () => {
  it('formats in lakhs', () => { expect(formatPriceShort(350000)).toBe('₹3.5L') })
  it('formats in thousands', () => { expect(formatPriceShort(18000)).toBe('₹18K') })
  it('formats small numbers', () => { expect(formatPriceShort(500)).toBe('₹500') })
})

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('abcdefghijklmnop', 10)).toBe('abcdefghij…')
  })
  it('keeps short strings', () => {
    expect(truncate('short', 10)).toBe('short')
  })
})

describe('getInitials', () => {
  it('gets initials from name', () => { expect(getInitials('Rajesh Negi')).toBe('RN') })
  it('handles single name', () => { expect(getInitials('Rajesh')).toBe('R') })
})

describe('getTimeAgo', () => {
  it('returns Just now for recent', () => {
    expect(getTimeAgo(new Date().toISOString())).toBe('Just now')
  })
})

describe('getFurnishingLabel', () => {
  it('maps types correctly', () => {
    expect(getFurnishingLabel('full')).toBe('Fully Furnished')
    expect(getFurnishingLabel('semi')).toBe('Semi Furnished')
    expect(getFurnishingLabel('none')).toBe('Unfurnished')
  })
})

describe('filterProperties', () => {
  const props = [
    { id: '1', type: 'Flat', city: 'Dehradun', price: 15000, amenities: ['wifi', 'ac'] },
    { id: '2', type: 'Room', city: 'Rishikesh', price: 8000, amenities: ['wifi'] },
  ]
  it('filters by type', () => {
    expect(filterProperties(props, { type: 'Flat' })).toHaveLength(1)
  })
  it('filters by city', () => {
    expect(filterProperties(props, { city: 'Dehradun' })).toHaveLength(1)
  })
  it('filters by price range', () => {
    expect(filterProperties(props, { priceMin: 10000, priceMax: 20000 })).toHaveLength(1)
  })
  it('filters by amenities', () => {
    expect(filterProperties(props, { amenities: ['ac'] })).toHaveLength(1)
  })
  it('returns all with no filters', () => {
    expect(filterProperties(props, {})).toHaveLength(2)
  })
})
