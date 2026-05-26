self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const title = data.title || 'SCCG Update';
        const options = {
            body: data.body || 'You have a new update.',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            vibrate: [100, 50, 100],
            data: data.data || {},
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
        console.error('Push parse error', e);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/driver')
    );
});
