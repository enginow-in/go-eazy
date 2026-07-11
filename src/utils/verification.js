/**
 * Calculates a live preview of the Verification Score based on heuristics.
 * NOTE: This is for UI preview ONLY. The actual authoritative score and status
 * are calculated and enforced server-side by a Postgres trigger on INSERT/UPDATE.
 * @param {Object} property 
 * @returns {Object} { score, status }
 */
export const calculateVerificationScorePreview = (property) => {
  let score = 0
  let descLength = 0
  let upperCount = 0
  let imagesCount = 0

  const description = property.description || ''
  
  if (description) {
    descLength = description.length

    // Length points
    if (descLength > 250) {
      score += 30
    } else if (descLength > 100) {
      score += 20
    }

    // Good keywords
    const lowerDesc = description.toLowerCase()
    if (lowerDesc.includes('spacious') || 
        lowerDesc.includes('furnished') || 
        lowerDesc.includes('natural light') || 
        lowerDesc.includes('security')) {
      score += 10
    }

    // Spam words penalty
    if (/click here|cheap|100% real|http:\/\/|https:\/\//i.test(description)) {
      score -= 30
    }

    // Suspicious phone number regex check (basic)
    if (/\d{10}/.test(description)) {
      score -= 10
    }

    // ALL CAPS penalty
    const upperChars = description.replace(/[^A-Z]/g, '')
    upperCount = upperChars.length
    if (descLength > 0 && (upperCount / descLength) > 0.3) {
      score -= 20
    }
  }

  // Media completeness
  if (property.images && Array.isArray(property.images)) {
    imagesCount = property.images.length
    score += Math.min(imagesCount * 10, 40)
  } else if (property.imagePreviews && Array.isArray(property.imagePreviews)) {
    // For live form preview using local files
    imagesCount = property.imagePreviews.length
    score += Math.min(imagesCount * 10, 40)
  }

  // Metadata completeness
  if (property.nearby_landmarks && property.nearby_landmarks.length > 0) {
    score += 5
  }
  if (property.pincode && property.pincode.length > 0) {
    score += 5
  }

  // Clamp score
  score = Math.max(0, Math.min(score, 100))

  let status = 'pending'
  if (score >= 70) {
    status = 'verified'
  } else if (score < 40) {
    status = 'flagged'
  }

  return { score, status }
}
