const CACHE_NAME = 'hooligans-v2';
const STATIC_ASSETS = [
    '/',
    '/menu',
    '/cart',
    '/manifest.json',
    '/logo/Hooligans Insty Logo 1.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((err) => {
                console.error('[SW] Failed to cache static assets:', err);
                // Don't fail installation if caching fails
            })
    );
    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    // Take control immediately
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip external requests
    if (url.origin !== location.origin) return;

    // API requests: Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful API responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseClone).catch((err) => {
                                    console.warn('[SW] Failed to cache API response:', err);
                                });
                            })
                            .catch((err) => {
                                console.warn('[SW] Failed to open cache for API:', err);
                            });
                    }
                    return response;
                })
                .catch((err) => {
                    // Fallback to cached API response
                    console.debug('[SW] API fetch failed, trying cache:', err.message);
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // No cache available, return error
                        return new Response('Network error', {
                            status: 408,
                            statusText: 'Request Timeout',
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
                })
        );
        return;
    }

    // Static assets and pages: Cache first, network fallback
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached version, update cache in background
                // Add error handling to prevent uncaught promise rejections
                fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, response).catch((err) => {
                                    console.warn('[SW] Failed to cache response:', err);
                                });
                            }).catch((err) => {
                                console.warn('[SW] Failed to open cache:', err);
                            });
                        }
                    })
                    .catch((err) => {
                        // Silently fail background cache update - we already have cached response
                        console.debug('[SW] Background cache update failed (non-critical):', err.message);
                    });
                return cachedResponse;
            }

            // Not in cache, fetch from network
            return fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseClone).catch((err) => {
                                    console.warn('[SW] Failed to cache response:', err);
                                });
                            })
                            .catch((err) => {
                                console.warn('[SW] Failed to open cache:', err);
                            });
                    }
                    return response;
                })
                .catch((err) => {
                    // If network fails and no cache, return error response
                    console.error('[SW] Fetch failed and no cache available:', err);
                    return new Response('Network error', {
                        status: 408,
                        statusText: 'Request Timeout',
                        headers: { 'Content-Type': 'text/plain' }
                    });
                });
        })
        .catch((err) => {
            console.error('[SW] Cache match failed:', err);
            // Fallback: try network fetch
            return fetch(request).catch((fetchErr) => {
                console.error('[SW] Both cache and network failed:', fetchErr);
                return new Response('Service unavailable', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain' }
                });
            });
        })
    );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
