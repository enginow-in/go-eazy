import { CITIES } from './constants'

// Available Amenities list for matching
const AMENITY_MAP = {
  wifi: 'WiFi',
  internet: 'WiFi',
  parking: 'Parking',
  car: 'Parking',
  bike: 'Parking',
  ac: 'AC',
  air: 'AC',
  cooler: 'AC',
  backup: 'Power Backup',
  power: 'Power Backup',
  generator: 'Power Backup',
  food: 'Food',
  mess: 'Food',
  meals: 'Food',
  kitchen: 'Food',
  tv: 'TV',
  television: 'TV',
  laundry: 'Laundry',
  washing: 'Laundry',
  gym: 'Gym',
  fitness: 'Gym',
  security: 'Security',
  cctv: 'Security',
  furnished: 'Furnished'
}

/**
 * Parses natural language voice or text prompt into structured property filters.
 * Example input: "Find a 2BHK flat in Dehradun under 15000 with wifi and parking near UPES"
 */
export const parseNaturalLanguageQuery = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return { type: '', city: '', priceMax: 100000, priceMin: 0, amenities: [], area: '', query: '' }
  }

  const lower = prompt.toLowerCase()
  const result = {
    type: '',
    city: '',
    priceMax: 100000,
    priceMin: 0,
    amenities: [],
    area: '',
    query: prompt.trim()
  }

  // 1. Property Type Detection
  if (lower.includes('flat') || lower.includes('apartment') || lower.includes('bhk')) {
    result.type = 'Flat'
  } else if (lower.includes('room') || lower.includes('studio') || lower.includes('single')) {
    result.type = 'Room'
  } else if (lower.includes('hostel')) {
    result.type = 'Hostel'
  } else if (lower.includes('pg') || lower.includes('paying guest')) {
    result.type = 'PG'
  }

  // 2. City Detection
  for (const city of CITIES) {
    if (lower.includes(city.toLowerCase())) {
      result.city = city
      break
    }
  }

  // 3. Price Detection (Under X, Below X, Less than X, budget X, X k)
  const priceMatches = lower.match(/(?:under|below|less than|budget|around|max|within|₹|\$)\s*(\d{1,2})k\b/i) ||
                      lower.match(/(?:under|below|less than|budget|around|max|within|₹|\$)\s*(\d{4,6})\b/i) ||
                      lower.match(/\b(\d{1,2})k\b/i) ||
                      lower.match(/\b(\d{4,6})\b/i)

  if (priceMatches) {
    let num = parseInt(priceMatches[1], 10)
    if (num < 200) num = num * 1000 // Convert "15k" -> 15000
    if (num >= 2000 && num <= 200000) {
      result.priceMax = num
    }
  }

  // 4. Amenities Detection
  const extractedAmenities = new Set()
  for (const [keyword, amenityName] of Object.entries(AMENITY_MAP)) {
    if (lower.includes(keyword)) {
      extractedAmenities.add(amenityName)
    }
  }
  result.amenities = Array.from(extractedAmenities)

  // 5. Area / Neighborhood Detection
  const landmarkKeywords = ['upes', 'rajpur road', 'clock tower', 'clement town', 'ballupur', 'premnagar', 'bidhooli', 'kaulagarh', 'subhash nagar', 'jakhan', 'doon']
  for (const lm of landmarkKeywords) {
    if (lower.includes(lm)) {
      result.area = lm.toUpperCase()
      break
    }
  }

  return result
}

/**
 * Calculates a dynamic 0-100% AI compatibility match score for a property.
 */
export const calculateAIMatchScore = (property, profile = null, activeFilters = {}) => {
  if (!property) return 75

  let score = 50 // Base match score
  const quiz = profile?.onboarding_data || {}
  const targetCity = activeFilters.city || quiz.city || ''
  const targetType = activeFilters.type || quiz.type || ''
  const targetMaxPrice = activeFilters.priceMax || quiz.budget?.range?.[1] || 100000

  // 1. City Match (+20 pts)
  if (targetCity) {
    if (property.city?.toLowerCase() === targetCity.toLowerCase()) {
      score += 20
    } else if (property.address?.toLowerCase().includes(targetCity.toLowerCase())) {
      score += 15
    }
  } else {
    score += 10
  }

  // 2. Property Type Match (+20 pts)
  if (targetType) {
    if (property.type === targetType) {
      score += 20
    }
  } else {
    score += 10
  }

  // 3. Price / Budget Fit (+15 pts)
  if (property.price <= targetMaxPrice) {
    const ratio = property.price / targetMaxPrice
    if (ratio >= 0.5 && ratio <= 0.95) {
      score += 15
    } else {
      score += 10
    }
  }

  // 4. Amenities Overlap (+10 pts)
  const filterAmenities = activeFilters.amenities || []
  if (filterAmenities.length > 0 && Array.isArray(property.amenities)) {
    const matches = filterAmenities.filter(a => property.amenities.includes(a))
    const ratio = matches.length / filterAmenities.length
    score += Math.round(ratio * 10)
  } else if (Array.isArray(property.amenities) && property.amenities.length > 3) {
    score += 8
  }

  // 5. Popularity / Views Bonus (+5 pts)
  if ((property.views || 0) > 50) {
    score += 5
  }

  // Ensure score stays bounded between 68% and 99%
  return Math.min(99, Math.max(68, score))
}
