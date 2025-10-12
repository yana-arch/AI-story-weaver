// Service Worker for AI Story Weaver
// Version 1.0.0

const CACHE_NAME = 'ai-story-weaver-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets as needed
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('generativelanguage.googleapis.com') ||
      event.request.url.includes('api.openai.com') ||
      event.request.url.includes('api.anthropic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((fetchResponse) => {
            // Check if valid response
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Clone the response
            const responseToCache = fetchResponse.clone();

            // Cache the response for future use
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                // Only cache certain types of requests
                if (shouldCache(event.request)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return fetchResponse;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed, serving offline content', error);

            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }

            // For other requests, just fail gracefully
            throw error;
          });
      })
  );
});

// Helper function to determine if a request should be cached
function shouldCache(request) {
  const url = new URL(request.url);

  // Cache images, CSS, JS, and fonts
  if (request.destination === 'image' ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font') {
    return true;
  }

  // Cache same-origin HTML, CSS, JS
  if (url.origin === location.origin &&
      (request.destination === 'document' ||
       url.pathname.endsWith('.css') ||
       url.pathname.endsWith('.js'))) {
    return true;
  }

  return false;
}

// Background sync for saving stories when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'save-story') {
    event.waitUntil(saveStoryWhenOnline());
  }
});

// Function to save story when back online
async function saveStoryWhenOnline() {
  try {
    // Get pending story saves from IndexedDB or localStorage
    const pendingSaves = await getPendingStorySaves();

    for (const save of pendingSaves) {
      try {
        // Attempt to save to your backend or local storage
        await saveStory(save.storyData);
        await removePendingSave(save.id);
        console.log('Service Worker: Story saved successfully', save.id);
      } catch (error) {
        console.error('Service Worker: Failed to save story', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Placeholder functions for story saving (implement based on your needs)
async function getPendingStorySaves() {
  // Implement getting pending saves from IndexedDB
  return [];
}

async function saveStory(storyData) {
  // Implement saving story to your backend or local storage
  return Promise.resolve();
}

async function removePendingSave(saveId) {
  // Implement removing pending save from IndexedDB
  return Promise.resolve();
}

// Push notification handling (for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
