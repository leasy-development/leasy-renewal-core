// PWA Service Worker setup for offline functionality
const CACHE_NAME = 'leasy-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Supabase requests when offline (they need real-time data)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Try to fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache successful responses
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline fallback for HTML pages
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
            
            // Return generic offline response for other resources
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for failed uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'property-upload') {
    event.waitUntil(
      retryFailedUploads()
    );
  }
});

// Retry failed uploads when back online
async function retryFailedUploads() {
  try {
    // Get failed uploads from IndexedDB
    const failedUploads = await getFailedUploads();
    
    for (const upload of failedUploads) {
      try {
        // Retry the upload
        await retryPropertyUpload(upload);
        
        // Remove from failed uploads
        await removeFailedUpload(upload.id);
        
        // Notify user of success
        self.registration.showNotification('Upload Complete', {
          body: `Property "${upload.title}" was successfully uploaded`,
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png'
        });
      } catch (error) {
        console.error('Failed to retry upload:', error);
      }
    }
  } catch (error) {
    console.error('Error processing failed uploads:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getFailedUploads() {
  // Implementation would use IndexedDB to get failed uploads
  return [];
}

async function removeFailedUpload(id) {
  // Implementation would remove the upload from IndexedDB
}

async function retryPropertyUpload(upload) {
  // Implementation would retry the property upload
  throw new Error('Not implemented');
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Leasy Update', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});