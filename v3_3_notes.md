# Release Notes - v3.3

**Go-Eazy v3.3** introduces intelligent personalization, a refined dashboard experience, and critical cross-platform compatibility fixes. 

## 🎯 Personalized Recommendations

- **Quiz-Based Suggestions**: Integrated a new **"Recommended for You"** section that tailors property suggestions based on user onboarding quiz data (City, Type, Budget).
- **Horizontal Discovery Slider**: Added a custom horizontal slider with a "Peek" effect (2.5 cards visible on mobile) to intuitively encourage exploration.
- **Redesigned Match Badge**: Features a pulsing Persian Red gradient and a sparkle icon, intelligently positioned to avoid visual collision with the Save icon.
- **Condensed Card UI**: Optimized typography and spacing for recommended properties to maintain a clean, compact, and highly scannable aesthetic.

## 🏠 Landlord Dashboard Refinements

- **Seamless Navigation**: Added an intuitive **"Back to Home"** flow.
- **Premium Minimalism**: Standardized list layouts and eliminated visual clutter for a sophisticated, high-end dashboard look.
- **Refined Status Tags**: Reduced status tag sizes to `text-[7px]` for a more delicate and professional appearance.

## 📅 Site Visit Booking & iOS Compatibility

- **Responsive Booking**: Refactored the booking section to be fully responsive, resolving mobile overflow and button clipping issues.
- **iOS Safari Fixes**: Implemented a custom date placeholder (`dd / mm / yyyy`) and Calendar icon specifically to address native input failures on iOS Safari.
- **Localization Patch**: Resolved raw code display issues by adding missing localization keys in `i18n.js`.

## 🛠️ Stability & Bug Fixes

- **Icon Import Resolution**: Fixed `ReferenceError: Calendar is not defined` by correctly importing icons from `lucide-react`.
- **Branch Synchronization**: Synchronized all UI and functional improvements seamlessly across `ui-enhancement` and `main` branches.

---
*Elevating Go-Eazy with intelligent features and pixel-perfect design.*
