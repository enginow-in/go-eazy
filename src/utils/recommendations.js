const SCORE_WEIGHTS = {
  typeMatch: 30,
  cityMatch: 25,
  budgetMatch: 20,
  amenityMatch: 15,
  popularityScore: 10
}

const calculateAmenityScore = (propertyAmenities, preferredAmenities) => {
  if (!preferredAmenities?.length || !propertyAmenities?.length) return 0
  const matches = preferredAmenities.filter(a => propertyAmenities.includes(a)).length
  return (matches / preferredAmenities.length) * 100
}

const calculatePopularityScore = (views, maxViews) => {
  if (!maxViews) return 0
  return (views / maxViews) * 100
}

const calculatePropertyScore = (property, preferences, maxViews) => {
  let score = 0

  if (preferences.type && property.type === preferences.type) {
    score += SCORE_WEIGHTS.typeMatch
  }

  if (preferences.city && property.city?.toLowerCase() === preferences.city.toLowerCase()) {
    score += SCORE_WEIGHTS.cityMatch
  }

  if (preferences.budget?.range) {
    const [min, max] = preferences.budget.range
    if (property.price >= min && property.price <= max) {
      score += SCORE_WEIGHTS.budgetMatch
    } else if (property.price >= min * 0.8 && property.price <= max * 1.2) {
      score += SCORE_WEIGHTS.budgetMatch * 0.5
    }
  }

  if (preferences.amenities?.length) {
    score += (calculateAmenityScore(property.amenities, preferences.amenities) / 100) * SCORE_WEIGHTS.amenityMatch
  }

  score += (calculatePopularityScore(property.views || 0, maxViews) / 100) * SCORE_WEIGHTS.popularityScore

  return score
}

const getRecentlyViewedTypes = (recentlyViewed, listings) => {
  if (!recentlyViewed?.length) return []
  return recentlyViewed
    .map(id => listings.find(p => p.id === id))
    .filter(Boolean)
    .map(p => p.type)
}

const getFavoritedCities = (favorites, listings) => {
  if (!favorites?.length) return []
  return favorites
    .map(id => listings.find(p => p.id === id))
    .filter(Boolean)
    .map(p => p.city)
}

export const getSmartRecommendations = ({
  listings,
  profile,
  recentlyViewed = [],
  favorites = [],
  limit = 8
}) => {
  if (!listings?.length) return []

  const preferences = profile?.onboarding_data
  if (!preferences || preferences.skipped || !preferences.persona) {
    return getFallbackRecommendations(listings, recentlyViewed, favorites, limit)
  }

  const maxViews = Math.max(...listings.map(p => p.views || 0), 1)

  const scored = listings.map(property => ({
    ...property,
    score: calculatePropertyScore(property, preferences, maxViews)
  }))

  const recentlyViewedTypes = getRecentlyViewedTypes(recentlyViewed, listings)
  if (recentlyViewedTypes.length) {
    scored.forEach(p => {
      if (recentlyViewedTypes.includes(p.type)) {
        p.score *= 1.1
      }
    })
  }

  const favoritedCities = getFavoritedCities(favorites, listings)
  if (favoritedCities.length) {
    scored.forEach(p => {
      if (favoritedCities.includes(p.city)) {
        p.score *= 1.05
      }
    })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

const getFallbackRecommendations = (listings, recentlyViewed, favorites, limit) => {
  const recentlyViewedTypes = getRecentlyViewedTypes(recentlyViewed, listings)
  const favoritedCities = getFavoritedCities(favorites, listings)

  const scored = listings.map(property => {
    let score = property.views || 0

    if (recentlyViewedTypes.includes(property.type)) {
      score *= 1.2
    }
    if (favoritedCities.includes(property.city)) {
      score *= 1.1
    }

    return { ...property, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export const getSimilarProperties = (currentProperty, allProperties, limit = 4) => {
  if (!currentProperty || !allProperties?.length) return []

  return allProperties
    .filter(p => p.id !== currentProperty.id)
    .map(property => {
      let score = 0

      if (property.type === currentProperty.type) score += 40
      if (property.city === currentProperty.city) score += 30
      if (Math.abs(property.price - currentProperty.price) < currentProperty.price * 0.3) score += 20

      const commonAmenities = (property.amenities || []).filter(a => 
        (currentProperty.amenities || []).includes(a)
      ).length
      score += (commonAmenities / Math.max(currentProperty.amenities?.length || 1, 1)) * 10

      return { ...property, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
