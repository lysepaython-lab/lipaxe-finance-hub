/* Lipaxe Service Worker — Web Push + minimal offline shell */
const CACHE = 'lipaxe-v1';
const ASSETS = ['/', '/lipaxe-icon.png', '/favicon.svg'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'Lipaxe', body: 'Nouvelle notification', link: '/app/notifications' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }
  const options = {
    body: data.body,
    icon: '/lipaxe-icon.png',
    badge: '/lipaxe-icon.png',
    vibrate: [120, 60, 120],
    tag: data.tag || 'lipaxe',
    renotify: true,
    data: { url: data.link || '/app/notifications' },
    requireInteraction: data.priority === 'high',
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/app/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) {
          w.focus();
          if ('navigate' in w) w.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
