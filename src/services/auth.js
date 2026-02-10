// src/services/auth.js
import { ref } from 'vue';
import { auth } from '../firebase';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const user = ref(null);
const profile = ref(null);
const authReady = ref(false);
let resolveAuthReady;
const authReadyPromise = new Promise((resolve) => {
  resolveAuthReady = resolve;
});

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Erro ao configurar persistência de autenticação:", error);
});

onAuthStateChanged(auth, (currentUser) => {
  user.value = currentUser;
  profile.value = null;
  if (!authReady.value) {
    authReady.value = true;
    resolveAuthReady(currentUser);
  }
});

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Erro ao fazer login com o Google:", error);
    alert("Erro ao fazer login com o Google. Por favor, tente novamente.");
    return null;
  }
};

const createUserProfile = async (userProfile) => {
  if (!userProfile) return;
  const payload = {
    name: userProfile.displayName || '',
    email: userProfile.email || '',
    created_at: serverTimestamp(),
    stats: {
      completed_quizzes: 0,
      total_points: 0
    }
  };
  const userRef = doc(db, 'users', userProfile.uid);
  const existing = await getDoc(userRef);
  if (!existing.exists()) {
    await setDoc(userRef, payload);
  }
};

const userProfileExists = async (uid) => {
  if (!uid) return false;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists();
};

const fetchUserProfile = async () => {
  if (!user.value) return null;
  if (profile.value && profile.value.uid === user.value.uid) {
    return profile.value;
  }
  const snap = await getDoc(doc(db, 'users', user.value.uid));
  if (snap.exists()) {
    profile.value = { uid: user.value.uid, ...snap.data() };
    return profile.value;
  }
  return null;
};

const logout = async () => {
  try {
    await signOut(auth);
    profile.value = null;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
};

export function useAuth() {
  return { user, profile, signInWithGoogle, logout, authReady, authReadyPromise, createUserProfile, userProfileExists, fetchUserProfile };
}
