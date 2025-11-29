// Service Worker for Push Notifications
self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push received');

    if (!event.data) {
        console.log('[Service Worker] Push event but no data');
        return;
    }

    try {
        const data = event.data.json();
        console.log('[Service Worker] Push data:', data);

        const options = {
            body: data.body || 'Nueva notificación',
            icon: data.icon || '/logo.png',
            badge: '/logo.png',
            vibrate: [200, 100, 200],
            data: data.data || {},
            tag: data.tag || 'default',
            requireInteraction: data.requireInteraction || false,
            actions: data.actions || []
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Barbería Sparta', options)
        );
    } catch (error) {
        console.error('[Service Worker] Error parsing push data:', error);
    }
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification clicked');
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                // Check if there's already a window open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

self.addEventListener('notificationclose', function (event) {
    console.log('[Service Worker] Notification closed', event.notification.tag);
});

// Handle service worker activation
self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activated');
    event.waitUntil(clients.claim());
});

self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installed');
    self.skipWaiting();
});
