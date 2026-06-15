import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "./firebase";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function formatAuthUser(user, overrides = {}) {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: overrides.email ?? user.email ?? "",
    displayName: overrides.displayName ?? user.displayName ?? "",
    photoURL: overrides.photoURL ?? user.photoURL ?? "",
    emailVerified: user.emailVerified ?? false,
  };
}

function buildUserProfile(user, overrides = {}) {
  return {
    uid: user.uid,
    displayName: overrides.displayName || user.displayName || "User",
    email: overrides.email || user.email || "",
    photoURL: overrides.photoURL || user.photoURL || "",
    bio: overrides.bio || "",
    followers: overrides.followers ?? 0,
    following: overrides.following ?? 0,
  };
}

async function createUserDocument(user, overrides = {}) {
  const profile = buildUserProfile(user, overrides);

  await setDoc(doc(db, "users", user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

async function ensureUserDocument(user, overrides = {}) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return createUserDocument(user, overrides);
  }

  const profile = {
    ...buildUserProfile(user, overrides),
    ...snapshot.data(),
    uid: user.uid,
  };

  await setDoc(
    userRef,
    {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return profile;
}

export async function registerWithEmail(email, password, displayName) {
  const cleanEmail = normalizeText(email).toLowerCase();
  const cleanName = normalizeText(displayName);

  if (!cleanName) {
    return { success: false, error: "Nama wajib diisi." };
  }

  if (!cleanEmail) {
    return { success: false, error: "Email wajib diisi." };
  }

  if (!password) {
    return { success: false, error: "Password wajib diisi." };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      password,
    );
    const user = userCredential.user;

    await updateAuthProfile(user, {
      displayName: cleanName,
    });

    const profile = await createUserDocument(user, {
      displayName: cleanName,
      email: cleanEmail,
    });

    return {
      success: true,
      user: formatAuthUser(user, { displayName: cleanName, email: cleanEmail }),
      profile,
    };
  } catch (error) {
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

export async function loginWithEmail(email, password) {
  const cleanEmail = normalizeText(email).toLowerCase();

  if (!cleanEmail) {
    return { success: false, error: "Email wajib diisi." };
  }

  if (!password) {
    return { success: false, error: "Password wajib diisi." };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password,
    );
    const profile = await ensureUserDocument(userCredential.user);

    return {
      success: true,
      user: formatAuthUser(userCredential.user),
      profile,
    };
  } catch (error) {
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

export async function loginWithGoogle(idToken) {
  if (!idToken) {
    return {
      success: false,
      error: "Token Google tidak ditemukan. Coba login ulang.",
    };
  }

  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;
    const profile = await ensureUserDocument(user);

    return {
      success: true,
      user: formatAuthUser(user),
      profile,
    };
  } catch (error) {
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

export async function logout() {
  try {
    await signOut(auth);
    return { success: true };
  } catch {
    return { success: false, error: "Gagal logout. Coba lagi." };
  }
}

export function getCurrentUser() {
  return formatAuthUser(auth.currentUser);
}

export function onAuthStateChanged(callback, onError) {
  return firebaseOnAuthStateChanged(
    auth,
    (user) => callback(formatAuthUser(user)),
    onError,
  );
}

function getAuthErrorMessage(code) {
  const messages = {
    "auth/email-already-in-use": "Email sudah terdaftar. Gunakan email lain.",
    "auth/invalid-email": "Format email tidak valid.",
    "auth/invalid-credential": "Email atau password salah.",
    "auth/invalid-login-credentials": "Email atau password salah.",
    "auth/missing-password": "Password wajib diisi.",
    "auth/operation-not-allowed": "Metode login ini belum diaktifkan di Firebase.",
    "auth/popup-closed-by-user": "Login Google dibatalkan.",
    "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi nanti.",
    "auth/user-not-found": "Akun tidak ditemukan.",
    "auth/weak-password": "Password terlalu lemah. Minimal 6 karakter.",
    "auth/wrong-password": "Password salah.",
    "auth/network-request-failed": "Tidak ada koneksi internet.",
  };

  return messages[code] || "Terjadi kesalahan. Coba lagi.";
}
