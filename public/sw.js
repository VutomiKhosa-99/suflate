// Service Worker for Push Notifications
// This file should be served from the root of your site

self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon || '/assets/icon-192.png',
    badge: data.badge || '/assets/badge-72.png',
    tag: data.tag,
    data: data.data,
    actions: [
      { action: 'open', title: 'Open LinkedIn' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open LinkedIn or the editor
  const urlToOpen = event.action === 'open' 
    ? 'https://www.linkedin.com/feed/?shareActive=true'
    : (event.notification.data?.url || '/drafts');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle service worker install
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Handle service worker activate
self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});
