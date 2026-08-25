// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDESqu4IKryXORUhd4CbHe35WffjdFQrDE",
  authDomain: "sdtp-b9f43.firebaseapp.com",
  projectId: "sdtp-b9f43",
  storageBucket: "sdtp-b9f43.firebasestorage.app",
  messagingSenderId: "688948312180",
  appId: "1:688948312180:web:245d15e269d2dfd5ed3921",
  measurementId: "G-KECG86S5MN"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Background Message Handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || '🚨 Safe Drive Alert';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'New scan alert received regarding your vehicle.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200, 100, 400],
    tag: 'safe-drive-alert',
    renotify: true,
    data: payload.data || {},
    actions: [
      { action: 'open_dashboard', title: 'Open Dashboard ↗' }
    ]
  };

  // Broadcast to all active client windows to trigger audio ringtone immediately
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({ type: 'PLAY_RINGTONE', payload });
    });
  });

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});
