const STORAGE_KEY = 'goeazy_taste_vector';
const VECTOR_DIMENSIONS = 7;

/**
 * Normalizes a value between 0 and 1 based on expected min/max
 */
const normalize = (val, min, max) => {
  if (val === undefined || val === null) return 0.5;
  if (val <= min) return 0;
  if (val >= max) return 1;
  return (val - min) / (max - min);
};

/**
 * Converts a property object into a numerical feature vector.
 * Features:
 * 0: Price (normalized 5000-50000)
 * 1: Bedrooms (normalized 1-4)
 * 2: Bathrooms (normalized 1-3)
 * 3: Sqft (normalized 500-2500)
 * 4: Is Furnished (1 or 0)
 * 5: Has Balcony (1 or 0)
 * 6: Has Modern/Luxury keywords (1 or 0)
 */
export const extractPropertyVector = (property) => {
  const isFurnished = (property.amenities || []).some(a => ['furniture', 'furnished', 'ac', 'tv', 'bed'].some(k => a.toLowerCase().includes(k))) ? 1 : 0;
  const hasBalcony = (property.amenities || []).some(a => a.toLowerCase().includes('balcony')) ? 1 : 0;
  
  const text = `${property.title || ''} ${property.description || ''}`.toLowerCase();
  const isModern = ['modern', 'luxury', 'premium', 'new', 'renovated'].some(k => text.includes(k)) ? 1 : 0;

  return [
    normalize(property.price, 5000, 50000),
    normalize(property.num_beds || 1, 1, 4),
    normalize(property.num_baths || 1, 1, 3),
    normalize(property.sqft || 500, 500, 2500),
    isFurnished,
    hasBalcony,
    isModern
  ];
};

/**
 * Cosine similarity between two vectors
 */
export const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Gets the current Taste Vector from localStorage
 */
export const getTasteVector = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const vec = JSON.parse(stored);
      if (Array.isArray(vec) && vec.length === VECTOR_DIMENSIONS) {
        return vec;
      }
    } catch (e) {
      console.error('Failed to parse taste vector', e);
    }
  }
  // Default unopinionated vector (middle values for continuous, 0 for binary)
  return [0.5, 0.5, 0.5, 0.5, 0, 0, 0];
};

/**
 * Updates the running average Taste Vector with a new property vector
 * Uses an exponential moving average (EMA) to slowly drift preferences
 */
export const updateTasteVector = (property) => {
  const currentVector = getTasteVector();
  const propertyVector = extractPropertyVector(property);
  
  // EMA weight (e.g., 0.2 means the new property influences the vector by 20%)
  const alpha = 0.2; 
  
  const newVector = currentVector.map((val, i) => {
    return (val * (1 - alpha)) + (propertyVector[i] * alpha);
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newVector));
  console.log('Taste Vector Updated:', newVector);
  window.dispatchEvent(new CustomEvent('taste_vector_updated', { detail: newVector }));
  return newVector;
};
