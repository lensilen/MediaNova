import { useCallback, useEffect } from "react";

import { useAuthStore } from "../store/authStore";
import {
  loginWithEmail,
  loginWithGoogle,
  logout,
  onAuthStateChanged,
  registerWithEmail,
} from "../utils/auth";
import { getUserProfile } from "../utils/profile";

let authSubscription = null;
let authHookUsers = 0;

function startAuthSubscription() {
  if (authSubscription) {
    return;
  }

  const store = useAuthStore.getState();
  store.setLoading(true);

  authSubscription = onAuthStateChanged(
    async (user) => {
      const latestStore = useAuthStore.getState();
      latestStore.setUser(user);

      if (!user) {
        latestStore.setProfile(null);
        latestStore.setLoading(false);
        return;
      }

      const profileResult = await getUserProfile(user.uid);

      if (profileResult.success) {
        latestStore.setProfile(profileResult.profile);
      }

      latestStore.setLoading(false);
    },
    () => {
      const latestStore = useAuthStore.getState();
      latestStore.setError("Gagal membaca status login. Coba buka ulang app.");
      latestStore.setLoading(false);
    },
  );
}

function stopAuthSubscription() {
  if (!authSubscription || authHookUsers > 0) {
    return;
  }

  authSubscription();
  authSubscription = null;
}

async function runAuthAction(action) {
  const store = useAuthStore.getState();
  store.setLoading(true);
  store.clearError();

  const result = await action();

  if (result.success) {
    store.setUser(result.user || null);
    store.setProfile(result.profile || null);
  } else {
    store.setError(result.error);
  }

  store.setLoading(false);
  return result;
}

export function useAuth() {
  const {
    user,
    profile,
    isAuthenticated,
    isLoading,
    error,
    clearError,
    setProfile,
  } = useAuthStore();

  useEffect(() => {
    authHookUsers += 1;
    startAuthSubscription();

    return () => {
      authHookUsers -= 1;
      stopAuthSubscription();
    };
  }, []);

  const register = useCallback(
    (email, password, displayName) =>
      runAuthAction(() => registerWithEmail(email, password, displayName)),
    [],
  );

  const login = useCallback(
    (email, password) => runAuthAction(() => loginWithEmail(email, password)),
    [],
  );

  const loginGoogle = useCallback(
    (idToken) => runAuthAction(() => loginWithGoogle(idToken)),
    [],
  );

  const signOut = useCallback(
    () =>
      runAuthAction(async () => {
        const result = await logout();

        if (result.success) {
          useAuthStore.getState().clearAuth();
        }

        return result;
      }),
    [],
  );

  return {
    user,
    profile,
    isAuthenticated,
    isLoading,
    error,
    clearError,
    setProfile,
    register,
    login,
    loginGoogle,
    signOut,
  };
}
