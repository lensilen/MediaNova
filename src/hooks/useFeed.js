import { useCallback } from "react";

import { useFeedStore } from "../store/feedStore";
import {
  createPost,
  deletePost,
  getFeedPosts,
  getPostById,
  getUserPosts,
} from "../utils/posts";

export function useFeed({ pageSize = 10 } = {}) {
  const { posts, lastDoc, hasMore, isLoading, isRefreshing, error, resetFeed } =
    useFeedStore();

  const loadFeed = useCallback(
    async ({ refresh = false } = {}) => {
      const store = useFeedStore.getState();

      if (store.isLoading && !refresh) {
        return { success: true, posts: store.posts };
      }

      if (refresh) {
        store.setRefreshing(true);
      } else {
        store.setLoading(true);
      }

      store.setError(null);

      const result = await getFeedPosts(
        pageSize,
        refresh ? null : store.lastDoc,
      );

      if (result.success) {
        if (refresh) {
          store.setPosts(result.posts);
        } else {
          store.appendPosts(result.posts);
        }

        store.setPagination({
          lastDoc: result.lastDoc,
          hasMore: result.hasMore,
        });
      } else {
        store.setError(result.error);
      }

      store.setLoading(false);
      store.setRefreshing(false);

      return result;
    },
    [pageSize],
  );

  const loadMore = useCallback(() => {
    const store = useFeedStore.getState();

    if (!store.hasMore || store.isLoading || store.isRefreshing) {
      return { success: true, posts: store.posts };
    }

    return loadFeed();
  }, [loadFeed]);

  const addPost = useCallback(async (...args) => {
    const store = useFeedStore.getState();
    store.setLoading(true);
    store.setError(null);

    const result = await createPost(...args);

    if (result.success) {
      store.prependPost(result.post);
    } else {
      store.setError(result.error);
    }

    store.setLoading(false);
    return result;
  }, []);

  const removePost = useCallback(async (postId) => {
    const store = useFeedStore.getState();
    store.setLoading(true);
    store.setError(null);

    const result = await deletePost(postId);

    if (result.success) {
      store.removePost(postId);
    } else {
      store.setError(result.error);
    }

    store.setLoading(false);
    return result;
  }, []);

  return {
    posts,
    lastDoc,
    hasMore,
    isLoading,
    isRefreshing,
    error,
    loadFeed,
    loadMore,
    addPost,
    removePost,
    resetFeed,
    getPostById,
    getUserPosts,
  };
}
