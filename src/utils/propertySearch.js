export const extractFilters = (message) => {
  const text = message.toLowerCase();

  const filters = {
    city: null,
    type: null,
    maxPrice: null,
    minPrice: null,
    bedrooms: null,
    furnished: false,
    amenities: [],
  };

  // Property Type
  const typeKeywords = {
    flat: ['flat', 'apartment', 'apt'],
    'Flat': ['flat', 'apartment', 'apt'],
    'Hostel': ['hostel', 'pg', 'p.g.', 'guest house'],
    'Room': ['room', 'single room'],
    'PG': ['pg', 'paying guest', 'p.g.'],
  };

  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      filters.type = type;
      break;
    }
  }

  // Bedrooms (1BHK, 2BHK, 3BHK, etc.)
  const bhkMatch = text.match(/(\d+)\s*(?:bhk|bed|bedroom)/i);
  if (bhkMatch) {
    filters.bedrooms = Number(bhkMatch[1]);
  }

  // Price parsing
  const pricePatterns = [
    /under\s*₹?\s*(\d+)\s*(lakh|lac|l)?/i,
    /below\s*₹?\s*(\d+)\s*(lakh|lac|l)?/i,
    /(?:within|up to)\s*₹?\s*(\d+)\s*(lakh|lac|l)?/i,
    /₹?\s*(\d+)\s*(lakh|lac|l)(?:\s|$)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = Number(match[1]);
      const unit = (match[2] || 'lakh').toLowerCase();
      const multiplier = unit.includes('l') ? 100000 : 1;
      filters.maxPrice = amount * multiplier;
      break;
    }
  }

  // Furnished status
  if (text.includes('fully furnished')) {
    filters.furnished = true;
  } else if (text.includes('semi furnished')) {
    filters.furnished = true;
  } else if (text.includes('furnished')) {
    filters.furnished = true;
  }

  // Amenities
  const amenityKeywords = ['parking', 'gym', 'wifi', 'ac', 'security', 'cctv', 'water', 'power', 'food', 'laundry'];
  amenityKeywords.forEach(amenity => {
    if (text.includes(amenity)) {
      filters.amenities.push(amenity);
    }
  });

  // Cities (expanded list)
  const cities = [
    'dehradun',
    'haridwar',
    'rishikesh',
    'haldwani',
    'roorkee',
    'mussoorie',
    'nainital',
    'srinagar',
    'rudrapur',
    'delhi',
    'mumbai',
    'bangalore',
    'pune',
  ];

  const foundCity = cities.find((c) => text.includes(c));
  if (foundCity) {
    filters.city = foundCity.charAt(0).toUpperCase() + foundCity.slice(1);
  }

  return filters;
};

export const searchProperties = (properties, filters) => {
  let results = [...properties];

  if (filters.city) {
    results = results.filter(
      (p) =>
        p.city &&
        p.city.toLowerCase().includes(filters.city.toLowerCase())
    );
  }

  if (filters.type) {
    results = results.filter(
      (p) =>
        p.type &&
        p.type.toLowerCase().includes(filters.type.toLowerCase())
    );
  }

  if (filters.maxPrice) {
    results = results.filter(
      (p) => Number(p.price) <= filters.maxPrice
    );
  }

  if (filters.bedrooms) {
    results = results.filter(
      (p) =>
        Number(p.bedrooms || p.bhk) === filters.bedrooms
    );
  }

  if (filters.furnished) {
    results = results.filter((p) => {
      const furnishing = String(p.furnishing || '').toLowerCase();
      return furnishing.includes('furnished') || furnishing.includes('fully furnished');
    });
  }

  if (filters.amenities.length > 0) {
    results = results.filter((p) => {
      const propertyAmenities = p.amenities || [];
      return filters.amenities.some(amenity =>
        propertyAmenities.some(pa =>
          String(pa).toLowerCase().includes(amenity.toLowerCase())
        )
      );
    });
  }

  return results.slice(0, 5);
};

export const formatPropertySummary = (property) => {
  const parts = [];

  if (property.type) {
    parts.push(property.type);
  }

  if (property.area) {
    parts.push(property.area);
  }

  return parts.join(' • ');
};