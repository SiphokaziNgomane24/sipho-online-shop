import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA4lKmx_loID-pZItbWOsmZ_ZEWHKYo8m8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "online-thread-shop.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://online-thread-shop-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "online-thread-shop",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "online-thread-shop.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1063165876849",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1063165876849:web:1fc09460c006c13d1b19d0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LF6EYSFKV8",
};

const app = initializeApp(firebaseConfig);

let analytics = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics unsupported in environment
    });
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
