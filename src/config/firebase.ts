// ============================================================
// LEFTOVER - Firebase Configuration
// ============================================================
//
// SETUP INSTRUCTIONS:
//
// 1. Go to https://console.firebase.google.com
// 2. Create a new project called "leftover" (or whatever you want)
// 3. Enable Authentication → Sign-in method → Apple + Google
// 4. Create a Firestore Database (start in test mode for dev)
// 5. Go to Project Settings → General → Your apps → Add Web App
// 6. Copy the config values below
//
// INSTALL:
//   npx expo install firebase
//
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBY2y7e8IGuUYgw-p42FJ5v7ncJeC7G1pY",
  authDomain: "leftover-app-7e6c2.firebaseapp.com",
  projectId: "leftover-app-7e6c2",
  storageBucket: "leftover-app-7e6c2.firebasestorage.app",
  messagingSenderId: "450913259929",
  appId: "1:450913259929:web:ce04b66c7791206384c308"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
