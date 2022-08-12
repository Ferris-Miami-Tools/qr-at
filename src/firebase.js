import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY || "AIzaSyDDc8TNSp6Nyo9KOUliE7Myjzq2CNE_3x8",
  authDomain: import.meta.env.VITE_AUTH_DOMAIN || "qr-at-prod.firebaseapp.com",
  projectId: import.meta.env.VITE_PROJECT_ID || "qr-at-prod",
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET || "qr-at-prod.appspot.com",
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID || "110682686293",
  appId: import.meta.env.VITE_APP_ID || "1:110682686293:web:abbb66e1c65b86981165dc",
  measurementId: import.meta.env.VITE_MEASUREMENT_ID || "G-84ECD6BJSN"
};

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore();

export { analytics, auth, db };
