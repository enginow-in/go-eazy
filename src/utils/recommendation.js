export const scoreRelatedProperty = (current, candidate) => {
  let score = 0
  if (!current || !candidate) return score

  if (candidate.city === current.city) score += 5
  if (candidate.area && current.area && candidate.area === current.area) score += 4
  if (candidate.type === current.type) score += 3

  const currentPrice = Number(current.price) || 0
  const candidatePrice = Number(candidate.price) || 0
  if (currentPrice > 0 && candidatePrice > 0) {
    const diff = Math.abs(candidatePrice - currentPrice) / currentPrice
    if (diff <= 0.2) score += 2
  }

  if (candidate.gender && current.gender && candidate.gender === current.gender) {
    score += 2
  }

  if (Array.isArray(current.amenities) && Array.isArray(candidate.amenities)) {
    const set = new Set(current.amenities)
    let common = 0
    for (const a of candidate.amenities) {
      if (set.has(a)) common++
    }
    score += common
  }

  if (candidate.availability !== false) score += 1

  return score
}

export const rankRelatedProperties = (current, candidates, maxResults = 6) => {
  if (!current || !Array.isArray(candidates)) return []

  const scored = candidates
    .filter(c => c.id !== current.id)
    .map(c => ({
      ...c,
      _score: scoreRelatedProperty(current, c),
    }))
    .sort((a, b) => b._score - a._score)

  const anyPositive = scored.some(p => p._score > 0)
  if (!anyPositive) {
    return scored.slice(0, maxResults)
  }

  return scored
    .filter(p => p._score > 0)
    .slice(0, maxResults)
}