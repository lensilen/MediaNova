import { create } from "zustand";

export const useThemeStore = create((set) => ({
  mode: "light",
  setMode: (mode) => set({ mode: mode === "light" ? "light" : "dark" }),
  toggleMode: () =>
    set((state) => ({ mode: state.mode === "dark" ? "light" : "dark" })),
}));

export const themeStore = useThemeStore;
