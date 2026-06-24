import { create } from "zustand";

export const useSocialStore = create((set) => ({
  likedPosts: [],
  savedPosts: [],

  toggleLike: (post) =>
    set((state) => {
      const exists = state.likedPosts.some(
        (item) => item.id === post.id
      );

      return {
        likedPosts: exists
          ? state.likedPosts.filter(
              (item) => item.id !== post.id
            )
          : [...state.likedPosts, post],
      };
    }),

  toggleSave: (post) =>
    set((state) => {
      const exists = state.savedPosts.some(
        (item) => item.id === post.id
      );

      return {
        savedPosts: exists
          ? state.savedPosts.filter(
              (item) => item.id !== post.id
            )
          : [...state.savedPosts, post],
      };
    }),
}));