self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'GachaDaily', {
      body: data.body ?? 'Your daily reset is coming up.',
      icon: data.icon ?? '/icons/placeholder.svg',
      badge: '/icons/placeholder.svg',
      data: data.data ?? { url: '/dashboard' },
      tag: data.tag ?? 'gachadaily-reminder',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/dashboard';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(url) && 'focus' in client) return client.focus();
        }
        return clients.openWindow(url);
      })
  );
});
