import { create } from 'zustand';

import {
  listenToAuthState,
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
} from '../utils/auth';

let unsubscribeAuth = null;

function normalizeError(error) {
  if (!error?.code) {
    return error?.message || 'Terjadi kesalahan. Coba lagi.';
  }

  const messages = {
    'auth/email-already-in-use': 'Email sudah terdaftar.',
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/invalid-email': 'Format email belum benar.',
    'auth/popup-closed-by-user': 'Login Google dibatalkan.',
    'auth/weak-password': 'Password minimal 6 karakter.',
  };

  return messages[error.code] || error.message;
}

export const useAuthStore = create((set) => ({
  error: null,
  isLoading: true,
  user: null,

  clearError: () => set({ error: null }),

  startAuthListener: () => {
    if (unsubscribeAuth) {
      return unsubscribeAuth;
    }

    unsubscribeAuth = listenToAuthState(
      (user) => set({ error: null, isLoading: false, user }),
      (error) => set({ error: normalizeError(error), isLoading: false })
    );

    return unsubscribeAuth;
  },

  loginEmail: async (email, password) => {
    set({ error: null, isLoading: true });

    try {
      const user = await loginWithEmail(email, password);
      set({ error: null, isLoading: false, user });
      return user;
    } catch (error) {
      set({ error: normalizeError(error), isLoading: false });
      throw error;
    }
  },

  registerEmail: async (name, email, password) => {
    set({ error: null, isLoading: true });

    try {
      const user = await registerWithEmail(name, email, password);
      set({ error: null, isLoading: false, user });
      return user;
    } catch (error) {
      set({ error: normalizeError(error), isLoading: false });
      throw error;
    }
  },

  loginGoogle: async (tokens) => {
    set({ error: null, isLoading: true });

    try {
      const user = await loginWithGoogle(tokens);
      set({ error: null, isLoading: false, user });
      return user;
    } catch (error) {
      set({ error: normalizeError(error), isLoading: false });
      throw error;
    }
  },

  logoutUser: async () => {
    set({ error: null, isLoading: true });

    try {
      await logout();
      set({ error: null, isLoading: false, user: null });
    } catch (error) {
      set({ error: normalizeError(error), isLoading: false });
      throw error;
    }
  },
}));
