// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA4lKmx_loID-pZItbWOsmZ_ZEWHKYo8m8",
  authDomain: "online-thread-shop.firebaseapp.com",
  databaseURL: "https://online-thread-shop-default-rtdb.firebaseio.com",
  projectId: "online-thread-shop",
  storageBucket: "online-thread-shop.firebasestorage.app",
  messagingSenderId: "1063165876849",
  appId: "1:1063165876849:web:518a79624b6ebea91b19d0",
  measurementId: "G-HQLCXSND1H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);