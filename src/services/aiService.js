import {
  extractFilters,
  searchProperties,
} from "../utils/propertySearch";

const resetPatterns = /\b(forget|reset|clear|forget it|never mind|start over)\b/i;
const fillerPrefixes = /^(\s*(ok|okay|hey|hi|please|so|well|and|then|also|anyways|anyway)[,\s]*)+/i;

const normalizeMessage = (message) => {
  if (!message || typeof message !== 'string') return '';
  let text = message.trim();
  // Remove polite/filler prefixes like "ok", "hey", "please"
  text = text.replace(fillerPrefixes, '').trim();
  // Remove trailing polite words
  text = text.replace(/\b(please|thanks|thank you)\b\.?$/i, '').trim();
  return text;
};

const containsQueryTokens = (text) => {
  if (!text) return false;
  const q = text.toLowerCase();
  const tokens = ['bhk', 'bed', 'lakh', '₹', 'rupee', 'flat', 'apartment', 'pg', 'hostel', 'villa', 'rent', 'sale', 'parking', 'balcony', 'garden', 'furnished', 'semi furnished', 'unfurnished', 'dehradun', 'rishikesh', 'haridwar', 'nainital', 'srinagar', 'haldwani'];
  return tokens.some(t => q.includes(t)) || /\d+/.test(q);
};

export const getAIResponse = (message, listings) => {
  const cleaned = normalizeMessage(message);
  const isReset = resetPatterns.test(message || '');

  // If user asked to reset/forget with no other query
  if (isReset && !containsQueryTokens(cleaned)) {
    return {
      text: "Okay — I've cleared the previous preferences. What would you like me to look for now?",
      properties: [],
    };
  }

  // If message is only small talk or empty after cleaning, reply conversationally
  if (!containsQueryTokens(cleaned)) {
    // If it was small talk like "ok" or "thanks", respond naturally
    if (/^\s*(ok|okay|thanks|thank you|cool|nice|got it|sure)\b/i.test(message || '')) {
      return {
        text: "No problem — tell me what kind of property you'd like to find (e.g., '2 BHK under ₹40 lakh in Dehradun').",
        properties: [],
      };
    }

    return {
      text: "Hi! I can help you find properties — try something like '2 BHK under ₹40 lakh' or 'Furnished apartments in Dehradun'.",
      properties: [],
    };
  }

  // Proceed with normal search using cleaned message
  const filters = extractFilters(cleaned);
  const matches = searchProperties(listings, filters);

  if (!matches || matches.length === 0) {
    return {
      text:
        "I couldn't find any matching properties. Try increasing your budget, changing the city, or removing filters like furnishing.",
      properties: [],
    };
  }

  const propertyCount = matches.length;
  const countText = propertyCount === 1 ? 'property' : 'properties';

  // Conversational lead-in
  let responseText = `Nice — I found ${propertyCount} ${countText} that might match your request`;

  const qualifiers = [];
  if (filters.bedrooms) qualifiers.push(`${filters.bedrooms} BHK`);
  if (filters.city) qualifiers.push(`in ${filters.city}`);
  if (filters.maxPrice) qualifiers.push(`under ₹${(filters.maxPrice / 100000).toFixed(1)} lakh`);

  if (qualifiers.length) {
    responseText += ` (${qualifiers.join(' • ')})`;
  }

  responseText += ".\n\nHere are the top results:";

  responseText += '\n\n' + matches
    .map((p, idx) => {
      const amenities = p.amenities && p.amenities.length > 0 ? ` • ${p.amenities.slice(0, 2).join(', ')}` : '';
      return `${idx + 1}. ${p.title}\n   ₹${Number(p.price).toLocaleString()}${amenities}`;
    })
    .join('\n\n');

  responseText += "\n\nWould you like me to sort these by price, show only furnished ones, or expand the search?";

  return {
    text: responseText,
    properties: matches,
  };
};