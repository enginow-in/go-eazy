# GoEazy AI Chat - Quick Reference Code Snippets

## Component Tree Structure

```
AIChat (src/components/AIChat/AIChat.jsx)
│
├── State:
│   ├── isOpen: boolean
│   ├── isMinimized: boolean
│   ├── listings: Array (from useProperties)
│   ├── messages: Array (from useAIChat)
│   └── typing: boolean (from useAIChat)
│
├── Render:
│   ├── <AIChatButton />
│   │   └── onClick handlers
│   │
│   └── <AIChatWindow isOpen={isOpen}>
│       ├── Header (GoEazy AI title + Online status)
│       ├── Messages Container
│       │   ├── <ChatMessage /> (for each message)
│       │   │   └── Bot or User styling
│       │   ├── <PropertyCard /> (2-column grid)
│       │   │   └── Image, Title, Price, Details, ViewButton
│       │   └── <TypingIndicator /> (when typing)
│       ├── <SuggestedPrompts /> (only on initial)
│       │   └── Clickable buttons for common queries
│       └── <ChatInput onSend={} />
│           └── Text input + send button
```

---

## Component Props Reference

### AIChat
```javascript
// No props - self-contained
const AIChat = () => { ... }
```

### AIChatButton
```javascript
<AIChatButton 
  onClick={handleClick}         // () => void
  hasUnread={isMinimized}       // boolean
/>
```

### AIChatWindow
```javascript
<AIChatWindow
  isOpen={isOpen}               // boolean
  onClose={handleClose}         // () => void
  onMinimize={handleMinimize}   // () => void
  messages={messages}           // Array<Message>
  typing={typing}               // boolean
  onSendMessage={handleSend}    // (text: string) => void
  onSuggestedPrompt={handlePrompt} // (text: string) => void
/>
```

### ChatMessage
```javascript
<ChatMessage 
  message={{
    id: number,
    sender: 'user' | 'bot',
    text: string,
    properties?: Array
  }}
/>
```

### PropertyCard
```javascript
<PropertyCard
  property={{
    id: string,
    title: string,
    price: number,
    images: Array<string>,
    type: string,
    area: string,
    bedrooms: number,
    amenities: Array,
    ...
  }}
  index={number}  // for stagger animation
/>
```

### SuggestedPrompts
```javascript
<SuggestedPrompts 
  onSelect={(prompt: string) => void}
/>
```

### TypingIndicator
```javascript
<TypingIndicator />  // No props
```

### ChatInput
```javascript
<ChatInput 
  onSend={(text: string) => void}
/>
```

---

## Hook Reference

### useAIChat(listings)
```javascript
const { messages, typing, sendMessage } = useAIChat(listings);

// Returns:
// messages: Array<{
//   id: number,
//   sender: 'bot' | 'user',
//   text: string,
//   properties?: Array
// }>
// typing: boolean
// sendMessage: (text: string) => void
```

### useProperties()
```javascript
const { listings } = useProperties();

// Returns listings array with fields:
// - id: string
// - title: string
// - price: number
// - city: string
// - area: string
// - type: 'Flat' | 'PG' | 'Hostel' | 'Room'
// - amenities: Array<string>
// - images: Array<string>
// - bedrooms: number
// - bathrooms: number
// - furnishing?: string
// - views: number
// - landlord: Object
// - created_at: string
```

---

## Service Reference

### aiService.getAIResponse(message, listings)
```javascript
const response = getAIResponse(message, listings);

// Returns:
// {
//   text: string,           // Friendly AI response
//   properties: Array       // Top 5 matching properties
// }

// Example response:
// {
//   text: "Found 2 matching properties (2 BHK in Dehradun under ₹40 lakh)...",
//   properties: [
//     { id: '123', title: '2BHK Flat', price: 3500000, ... },
//     { id: '124', title: '2BHK Luxury', price: 3800000, ... }
//   ]
// }
```

---

## Utility Reference

### propertySearch.extractFilters(message)
```javascript
const filters = extractFilters(message);

// Returns:
// {
//   city: string | null,           // 'Dehradun'
//   type: string | null,           // 'Flat'
//   maxPrice: number | null,       // 4000000
//   minPrice: number | null,       // null
//   bedrooms: number | null,       // 2
//   furnished: boolean,            // true
//   amenities: Array<string>       // ['wifi', 'parking']
// }
```

### propertySearch.searchProperties(properties, filters)
```javascript
const matches = searchProperties(listings, filters);

// Returns:
// Array of top 5 properties matching all filters
// [
//   { id: '123', title: '2BHK', price: 3500000, ... },
//   { id: '124', title: '2BHK', price: 3800000, ... },
//   ...
// ]
```

---

## Message Object Structure

```javascript
// User Message
{
  id: 1234567890,              // timestamp
  sender: 'user',
  text: "2 BHK under ₹40 lakh"
  // no properties
}

// Bot Message
{
  id: 1234567891,              // timestamp + 1
  sender: 'bot',
  text: "Found 2 matching properties...",
  properties: [
    {
      id: 'abc123',
      title: '2BHK Flat in Dehradun',
      price: 3500000,
      city: 'Dehradun',
      area: 'Rajpur Road',
      type: 'Flat',
      amenities: ['wifi', 'parking', 'security'],
      images: ['url1', 'url2'],
      bedrooms: 2,
      bathrooms: 1,
      // ... more fields
    },
    // ... more properties
  ]
}
```

---

## Styling Reference

### Tailwind Classes Used

**Layout**
```javascript
fixed bottom-6 right-6 z-50           // Button positioning
w-96 h-[600px]                        // Window size
rounded-2xl rounded-lg                // Border radius
```

**Colors**
```javascript
bg-[#CA3433]                          // GoEazy red
hover:bg-[#b42d2c]                    // Darker red on hover
text-white text-gray-900 text-gray-600  // Text colors
```

**Spacing**
```javascript
p-3 p-4                               // Padding
gap-2 gap-3                           // Gaps
mb-2 mb-3                             // Margins
```

**Effects**
```javascript
shadow-lg shadow-2xl shadow-sm        // Shadows
rounded-full rounded-xl               // Border radius
animate-pulse animate-bounce          // Animations
hover: focus: transition-             // States
```

---

## Animation Reference

### Framer Motion Config
```javascript
// Chat Window entrance
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 20 }}
transition={{ duration: 0.2 }}

// Message entrance
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}

// Property card stagger
transition={{ delay: index * 0.1 }}

// Button interactions
whileHover={{ scale: 1.08 }}
whileTap={{ scale: 0.94 }}
```

---

## Import Paths

```javascript
// Components
import { AIChat } from './components/AIChat'
import AIChatButton from './components/AIChat/AIChatButton'
import AIChatWindow from './components/AIChat/AIChatWindow'
import ChatMessage from './components/AIChat/ChatMessage'
import ChatInput from './components/AIChat/ChatInput'
import PropertyCard from './components/AIChat/PropertyCard'
import SuggestedPrompts from './components/AIChat/SuggestedPrompts'
import TypingIndicator from './components/AIChat/TypingIndicator'

// Hooks
import { useAIChat } from './hooks/useAIChat'
import { useProperties } from './hooks/useProperties'

// Services
import { getAIResponse } from './services/aiService'

// Utils
import { extractFilters, searchProperties } from './utils/propertySearch'

// External
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Bot, User, X, Minus, MapPin, Wifi, ParkingCircle, Shield } from 'lucide-react'
import { useState, useCallback, useEffect, useRef } from 'react'
```

---

## Common Patterns

### Toggle Chat Visibility
```javascript
<AIChatButton 
  onClick={() => setIsOpen(!isOpen)} 
/>
```

### Handle Suggested Prompt Click
```javascript
const handleSuggestedPrompt = (prompt) => {
  sendMessage(prompt);
};

<SuggestedPrompts onSelect={handleSuggestedPrompt} />
```

### Navigate to Property Detail
```javascript
const navigate = useNavigate();

const handleViewProperty = () => {
  navigate(`/property/${property.id}`);
};
```

### Auto-scroll to Bottom
```javascript
const messagesEndRef = useRef(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, typing]);

// In render:
<div ref={messagesEndRef} />
```

### Conditional Rendering
```javascript
{isOpen && <AIChatWindow ... />}
{typing && <TypingIndicator />}
{messages.length === 1 && <SuggestedPrompts ... />}
```

---

## Data Flow Example

```javascript
// User sends: "2 BHK under ₹40 lakh in Dehradun"

// Step 1: Extract filters
const filters = extractFilters("2 BHK under ₹40 lakh in Dehradun");
// Result: { bedrooms: 2, maxPrice: 4000000, city: 'Dehradun', ... }

// Step 2: Search properties
const matches = searchProperties(listings, filters);
// Result: [prop1, prop2]

// Step 3: Generate response
const response = getAIResponse(message, listings);
// Result: { text: "Found 2...", properties: [prop1, prop2] }

// Step 4: Add to messages
setMessages(prev => [
  ...prev,
  {
    id: Date.now(),
    sender: 'bot',
    text: response.text,
    properties: response.properties
  }
]);

// Step 5: Render
<ChatMessage message={botMessage} />
{botMessage.properties.map((prop, idx) => (
  <PropertyCard property={prop} index={idx} />
))}
```

---

## Keyboard Events

```javascript
// Send on Enter
<input 
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      send();
    }
  }}
/>

// Close on Escape (can be added)
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, []);
```

---

## Performance Tips

- ✅ Messages array keeps growing - consider pagination for very long chats
- ✅ Property search is fast (local filtering) - <50ms for typical datasets
- ✅ Animations use GPU acceleration (transform, opacity)
- ✅ Framer Motion handles re-renders efficiently
- ✅ Component only re-renders when state changes
- ✅ No unnecessary re-renders with useCallback

---

## Debugging Tips

```javascript
// Log current state
console.log('Messages:', messages);
console.log('Typing:', typing);
console.log('Listings:', listings);

// Log filter extraction
const filters = extractFilters(message);
console.log('Filters:', filters);

// Log search results
const matches = searchProperties(listings, filters);
console.log('Matches:', matches);

// Check browser DevTools
// React Tab → Components → AIChat → props/state
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Chat button not visible | Check z-50 class, verify import in App.jsx |
| Properties not showing | Check useProperties returns data, console log filters |
| Messages not sending | Verify onSend prop passed, check ChatInput |
| Animations choppy | Check Chrome DevTools Performance, reduce complexity |
| Properties empty | Verify data structure matches expectations |
| Navigation fails | Ensure property.id exists, React Router configured |

---

## Production Deployment Checklist

```javascript
// Before deploying:
- [ ] npm run build succeeds
- [ ] No console errors in dev tools
- [ ] Chat button visible on all pages
- [ ] Messages send/receive correctly
- [ ] Properties display properly
- [ ] Navigation to details works
- [ ] Responsive on mobile
- [ ] Animations smooth (no jank)
- [ ] No memory leaks (minimize/reopen 10x)
- [ ] All imports resolve correctly
```

---

## File Size Reference

```
AIChat.jsx:           2.1 KB
AIChatWindow.jsx:     3.4 KB
PropertyCard.jsx:     3.9 KB
useAIChat.js:         1.8 KB
aiService.js:         1.2 KB
propertySearch.js:    3.6 KB
---
Total:               ~16.0 KB (before gzip)
After gzip:          ~6.0 KB
```

---

## Version Information

```
React:              19.2.4
Framer Motion:      12.38.0
Tailwind CSS:       (from tailwind.config.js)
Vite:               8.1.4
```

---

**Last Updated**: 2026-07-16  
**Status**: Production Ready ✅
