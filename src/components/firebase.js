import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA4lKmx_loID-pZItbWOsmZ_ZEWHKYo8m8",
  authDomain: "online-thread-shop.firebaseapp.com",
  databaseURL: "https://online-thread-shop-default-rtdb.firebaseio.com",
  projectId: "online-thread-shop",
  storageBucket: "online-thread-shop.firebasestorage.app",
  messagingSenderId: "1063165876849",
  appId: "1:1063165876849:web:1fc09460c006c13d1b19d0",
  measurementId: "G-LF6EYSFKV8",
};

const app = initializeApp(firebaseConfig);
const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
