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
  };
  const userRef = doc(db, 'users', userProfile.uid);
  const existing = await getDoc(userRef);
  if (!existing.exists()) {
    await setDoc(userRef, payload);
  }
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
};

export function useAuth() {
  return { user, signInWithGoogle, logout, authReady, authReadyPromise, createUserProfile };
}
