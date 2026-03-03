const CACHE_NAME = 'wordlary-v1'

const PRECACHE_URLS = ['/offline.html']

// Install: precache the offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

// Fetch: strategy per resource type
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API routes — network only
  if (url.pathname.startsWith('/api/')) return

  // Skip external requests (Supabase, Gemini, etc.)
  if (url.origin !== self.location.origin) return

  // Static assets from Next.js build — cache first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Static files in public/ (images, manifest, fonts, etc.) — cache first
  if (
    url.pathname.match(
      /\.(png|jpg|jpeg|svg|gif|webp|ico|json|css|woff|woff2)$/
    )
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Navigation requests (HTML) — network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    const offlinePage = await caches.match('/offline.html')
    if (offlinePage) return offlinePage

    return new Response('Offline', { status: 503 })
  }
}
