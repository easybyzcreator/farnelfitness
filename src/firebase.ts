import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIi_YeBEC3pwv42GrjAB3P-77MxJyRfXs",
  authDomain: "app-farnel-fit.firebaseapp.com",
  projectId: "app-farnel-fit",
  storageBucket: "app-farnel-fit.firebasestorage.app",
  messagingSenderId: "1084160742672",
  appId: "1:1084160742672:web:96f6238f7276a6838f0195",
  measurementId: "G-GTWCCMP5JE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
