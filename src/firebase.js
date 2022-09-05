import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

let firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

if (import.meta.env.MODE == "production") {
  firebaseConfig = {
    apiKey: "AIzaSyDDc8TNSp6Nyo9KOUliE7Myjzq2CNE_3x8",
    authDomain: "qr-at-prod.firebaseapp.com",
    projectId: "qr-at-prod",
    storageBucket: "qr-at-prod.appspot.com",
    messagingSenderId: "110682686293",
    appId: "1:110682686293:web:abbb66e1c65b86981165dc",
    measurementId: "G-84ECD6BJSN",
  };
}

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore();
const functions = getFunctions(app);

export { analytics, auth, db, functions };
