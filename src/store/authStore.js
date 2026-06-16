import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
    }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  clearAuth: () =>
    set({
      user: null,
      profile: null,
      isAuthenticated: false,
      error: null,
    }),
}));

export const authStore = useAuthStore;
