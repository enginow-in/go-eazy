# TODO - PWA Support for GoEazy

## Step 0: Repo preparation
- [x] Inspect existing Vite/Tailwind/entry/router/README for brand color and wiring points.

## Step 1: Dependencies
- [x] Add `vite-plugin-pwa` dependency.

## Step 2: Vite configuration
- [x] Update `vite.config.js` to enable PWA, manifest generation, icons, service worker registration.


## Step 3: Offline fallback page
- [x] Create `public/offline.html`.


## Step 4: App icons
- [ ] Generate placeholder icons from `public/favicon.svg`:
  - [ ] `public/icon-192.png`
  - [ ] `public/icon-192-maskable.png`
  - [ ] `public/icon-512.png`
  - [ ] `public/icon-512-maskable.png`

## Step 5: Install prompt UI
- [ ] Create `src/components/ui/InstallAppBanner.jsx` using your UI component style.

## Step 6: Auto-update toast
- [x] Create a notifier component/hook and show a toast prompting refresh.


## Step 7: Wire into app
- [x] Render Install banner + update notifier at top level (`src/App.jsx` or `src/main.jsx`).


## Step 8: README update
- [x] Add “📱 PWA Support” section.


## Step 9: Verification
- [ ] Build and verify in Chrome DevTools (manifest valid, SW registered, offline simulation works).

