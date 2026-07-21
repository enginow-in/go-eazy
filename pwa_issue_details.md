# GitHub Issue: Implement Progressive Web App (PWA) & Offline Caching Support

**Title:** `feat: Add Progressive Web App (PWA) and offline caching support`

**Labels:** `enhancement`, `UX`, `performance`

---

## Description

### Problem Statement
Currently, GoEazy is a standard client-side SPA. When users (mostly students and professionals moving or traveling within Uttarakhand) are in areas with poor cellular reception (very common in hilly regions or transits), they experience:
1. Complete white-screen/network failure on navigation requests.
2. Inability to check previously viewed PG/Room listings when offline.
3. Slow initial load times because the app shell assets (JS/CSS/fonts/icons) must be requested from the network on every session restart.

### Proposed Solution
Turn GoEazy into an installable, offline-capable Progressive Web App (PWA) with a custom Service Worker routing strategy:

1. **Web App Manifest (`public/manifest.webmanifest`)**:
   - Provide standalone orientation, branding colors (`#CA3433`), launcher icons (192px, 512px, maskable), and wide/narrow form-factor screenshots.
   - Register shortcuts for `Search Properties` and `Nearby Services` to allow one-click launcher actions.

2. **Custom Service Worker (`public/sw.js`)**:
   - **Cache-First**: Cache the static app shell (HTML/JS/CSS), Google Fonts, and Mapbox GL library assets.
   - **Stale-While-Revalidate**: Immediately serve cached property/service photos (Unsplash & Supabase public storage) and update them in the background.
   - **Network-First (with 5 s Timeout)**: Try fetching fresh data for Supabase API requests first, falling back to local cached listings if offline or on slow 2G/3G connections.
   - **Offline Page**: Serve a self-contained `/offline.html` page when network requests fail.

3. **Install UI Promo (`PWAInstallBanner`)**:
   - Mount a premium install prompt banner that appears after a short delay, prompts the user to add the app to their home screen, and respects close/dismiss actions by persisting user choice in `localStorage`.

4. **Integration**:
   - Wire registration into `src/main.jsx` and PWA compatibility tags into `index.html`.
