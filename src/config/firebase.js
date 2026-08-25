import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyDESqu4IKryXORUhd4CbHe35WffjdFQrDE",
  authDomain: "sdtp-b9f43.firebaseapp.com",
  projectId: "sdtp-b9f43",
  storageBucket: "sdtp-b9f43.firebasestorage.app",
  messagingSenderId: "688948312180",
  appId: "1:688948312180:web:245d15e269d2dfd5ed3921",
  measurementId: "G-KECG86S5MN"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging if supported in browser environment
export let messaging = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.warn('Firebase messaging initialization warning:', err);
}

export const VAPID_KEY = "BCc2xzV1Pcu6gow45ZxMwwukmHD-A_hR2Mf-QJ8hTn2HEk0Qk9Z5g5Q4vkc9Vb_bJrf4QD53KJldm-hctH1VugY";

// Preload audio instance
let cachedAudio = null;
if (typeof window !== 'undefined') {
  try {
    cachedAudio = new Audio('/ring1.mp3');
    cachedAudio.load();
  } catch (e) {}
}

// Play audio alert helper with ring1.mp3
export const playNotificationSound = () => {
  try {
    const audio = cachedAudio || new Audio('/ring1.mp3');
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => console.log('Audio autoplay waiting for user interaction:', e));
    }
  } catch (err) {
    console.error('Audio play error:', err);
  }
};

// Request FCM Device Registration Token
export const requestFcmToken = async () => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register service worker if not already registered
      let swRegistration = null;
      if ('serviceWorker' in navigator) {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }

      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration || undefined
      });

      if (currentToken) {
        return currentToken;
      }
    }
  } catch (err) {
    console.warn('Error retrieving FCM token:', err);
  }
  return null;
};

// Setup foreground push notification listener
export const setupOnMessageListener = (onNotificationReceived) => {
  if (!messaging) return;
  return onMessage(messaging, (payload) => {
    // Play custom sound on foreground push
    playNotificationSound();
    if (onNotificationReceived) {
      onNotificationReceived(payload);
    }
  });
};
