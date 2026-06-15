import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { auth } from './firebase';

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  return credential.user;
}

export async function registerWithEmail(name, email, password) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  if (name.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }

  return credential.user;
}

export async function loginWithGoogle({ idToken, accessToken }) {
  if (!idToken && !accessToken) {
    throw new Error('Token Google tidak ditemukan. Cek konfigurasi OAuth.');
  }

  const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
  const credential = await signInWithCredential(auth, googleCredential);

  return credential.user;
}

export function listenToAuthState(onUserChanged, onError) {
  return onAuthStateChanged(auth, onUserChanged, onError);
}

export function logout() {
  return signOut(auth);
}
