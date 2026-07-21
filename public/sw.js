/**
 * GoEazy Service Worker
 * =====================
 * Caching strategy:
 *   - App shell (HTML/JS/CSS/fonts/icons) → Cache-First
 *   - Supabase API responses             → Network-First (5 s timeout)
 *   - Property images (unsplash/storage) → Stale-While-Revalidate
 *   - Mapbox tiles/glyphs                → Cache-First (long TTL)
 *
 * On update: the SW waits for all clients to close before activating,
 * and posts a 'SW_UPDATE_AVAILABLE' message so the app can prompt the user.
 */

const CACHE_VERSION = 'v1'
const SHELL_CACHE   = `goeazy-shell-${CACHE_VERSION}`
const API_CACHE     = `goeazy-api-${CACHE_VERSION}`
const IMG_CACHE     = `goeazy-images-${CACHE_VERSION}`
const MAP_CACHE     = `goeazy-mapbox-${CACHE_VERSION}`

/** Static assets that form the app shell */
const SHELL_ASSETS = [
  '/',
  '/search',
  '/offline.html',
]

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Pre-cache shell assets (best-effort; non-critical assets may 404 in CI)
      cache.addAll(SHELL_ASSETS).catch(() => {})
    )
  )
  // Don't skipWaiting — let the app prompt the user to refresh instead
})

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE, API_CACHE, IMG_CACHE, MAP_CACHE]
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  )
})

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests
  if (request.method !== 'GET') return

  // 1. Supabase REST/Realtime API → Network-First with 5 s timeout
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.com')) {
    event.respondWith(networkFirstWithTimeout(request, API_CACHE, 5000))
    return
  }

  // 2. Mapbox tiles, glyphs, sprites → Cache-First (rarely changes)
  if (url.hostname.includes('mapbox.com') || url.hostname.includes('mapbox.net')) {
    event.respondWith(cacheFirst(request, MAP_CACHE))
    return
  }

  // 3. Property / service images → Stale-While-Revalidate
  if (
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('images.unsplash') ||
    url.pathname.includes('/storage/v1/object/public/')
  ) {
    event.respondWith(staleWhileRevalidate(request, IMG_CACHE))
    return
  }

  // 4. Google Fonts → Cache-First
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, SHELL_CACHE))
    return
  }

  // 5. App shell (HTML navigation requests) → Network-First, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html') || caches.match('/')
      )
    )
    return
  }

  // 6. Everything else (JS/CSS chunks, icons) → Cache-First
  event.respondWith(cacheFirst(request, SHELL_CACHE))
})

// ─── Message handler (for app-initiated SW updates) ───────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Cache-First: return cached response or fetch & cache it.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

/**
 * Network-First with a configurable timeout.
 * Falls back to cache if the network takes too long or is unavailable.
 */
async function networkFirstWithTimeout(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName)

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeoutMs)
  )

  try {
    const response = await Promise.race([fetch(request), timeoutPromise])
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Stale-While-Revalidate: return cache immediately, then update in background.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchAndUpdate = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)

  return cached || fetchAndUpdate || new Response('Offline', { status: 503 })
}
