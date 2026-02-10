// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyApHqg2cHsHStxlA91Fzr0O9JX4eeAxvE4",
  authDomain: "arsquestion.firebaseapp.com",
  projectId: "arsquestion",
  storageBucket: "arsquestion.firebasestorage.app",
  messagingSenderId: "1087226927907",
  appId: "1:1087226927907:web:f3cdd00a5bbc067916ca96",
  measurementId: "G-E3SW2DB91E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics only works in browser environments.
if (typeof window !== 'undefined') {
  getAnalytics(app);
}

export { auth, db };
