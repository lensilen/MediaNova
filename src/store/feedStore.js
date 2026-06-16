import { create } from "zustand";

function mergePosts(existingPosts, incomingPosts) {
  const postMap = new Map();

  [...existingPosts, ...incomingPosts].forEach((post) => {
    if (post?.id) {
      postMap.set(post.id, post);
    }
  });

  return Array.from(postMap.values());
}

export const useFeedStore = create((set) => ({
  posts: [],
  lastDoc: null,
  hasMore: true,
  isLoading: false,
  isRefreshing: false,
  error: null,

  setPosts: (posts) => set({ posts }),
  appendPosts: (posts) =>
    set((state) => ({
      posts: mergePosts(state.posts, posts),
    })),
  prependPost: (post) =>
    set((state) => ({
      posts: post?.id ? mergePosts([post], state.posts) : state.posts,
    })),
  removePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
    })),
  setPagination: ({ lastDoc, hasMore }) => set({ lastDoc, hasMore }),
  setLoading: (isLoading) => set({ isLoading }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setError: (error) => set({ error }),
  resetFeed: () =>
    set({
      posts: [],
      lastDoc: null,
      hasMore: true,
      isLoading: false,
      isRefreshing: false,
      error: null,
    }),
}));

export const feedStore = useFeedStore;
