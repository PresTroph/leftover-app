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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
