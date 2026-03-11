// Listen for incoming push messages
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'OasisSpace Notification';
  const options = {
    body: data.body || 'You have a new update.',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for clicks on the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Open the app when the notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus it
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      // Otherwise, open a new window
      return clients.openWindow('/');
    })
  );
});
