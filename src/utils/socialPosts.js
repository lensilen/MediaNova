import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as queryLimit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "./firebase";
import {
  createDocId,
  createSocialError,
  getSocialErrorMessage,
  normalizeQuerySnapshot,
  normalizeText,
  normalizeLimit,
  sortNewestFirst,
  validatePostUser,
} from "./socialHelpers";
import { createNotification } from "./notifications";

export async function likePost(postId, userId) {
  const validation = validatePostUser(postId, userId);

  if (validation.error) {
    return { success: false, error: validation.error };
  }

  const likeId = createDocId(validation.userId, validation.postId);
  const likeRef = doc(db, "likes", likeId);
  const postRef = doc(db, "posts", validation.postId);

  try {
    const transactionResult = await runTransaction(db, async (transaction) => {
      const postSnapshot = await transaction.get(postRef);
      const likeSnapshot = await transaction.get(likeRef);

      if (!postSnapshot.exists()) {
        throw createSocialError("post-not-found", "Post tidak ditemukan.");
      }

      const post = postSnapshot.data();

      if (likeSnapshot.exists()) {
        return { changed: false, toUserId: post.userId };
      }

      transaction.set(likeRef, {
        userId: validation.userId,
        postId: validation.postId,
        createdAt: serverTimestamp(),
      });
      transaction.update(postRef, {
        likes: increment(1),
        updatedAt: serverTimestamp(),
      });

      return { changed: true, toUserId: post.userId };
    });

    if (transactionResult.changed) {
      await createNotification(
        transactionResult.toUserId,
        validation.userId,
        "like",
        validation.postId,
      );
    }

    return {
      success: true,
      liked: true,
      changed: transactionResult.changed,
      likeId,
    };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export async function unlikePost(postId, userId) {
  const validation = validatePostUser(postId, userId);

  if (validation.error) {
    return { success: false, error: validation.error };
  }

  const likeId = createDocId(validation.userId, validation.postId);
  const likeRef = doc(db, "likes", likeId);
  const postRef = doc(db, "posts", validation.postId);

  try {
    const transactionResult = await runTransaction(db, async (transaction) => {
      const postSnapshot = await transaction.get(postRef);
      const likeSnapshot = await transaction.get(likeRef);

      if (!postSnapshot.exists()) {
        throw createSocialError("post-not-found", "Post tidak ditemukan.");
      }

      if (!likeSnapshot.exists()) {
        return { changed: false };
      }

      const currentLikes = Number(postSnapshot.data().likes || 0);

      transaction.delete(likeRef);
      transaction.update(postRef, {
        likes: Math.max(currentLikes - 1, 0),
        updatedAt: serverTimestamp(),
      });

      return { changed: true };
    });

    return {
      success: true,
      liked: false,
      changed: transactionResult.changed,
      likeId,
    };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export async function isLiked(postId, userId) {
  const validation = validatePostUser(postId, userId);

  if (validation.error) {
    return { success: false, error: validation.error };
  }

  try {
    const likeId = createDocId(validation.userId, validation.postId);
    const snapshot = await getDoc(doc(db, "likes", likeId));

    return { success: true, isLiked: snapshot.exists() };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export function subscribePostSocial(postId, callback, onError) {
  const cleanPostId = normalizeText(postId);

  if (!cleanPostId || typeof callback !== "function") {
    return () => {};
  }

  return onSnapshot(
    doc(db, "posts", cleanPostId),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback({
          success: false,
          error: "Post tidak ditemukan.",
        });
        return;
      }

      const post = snapshot.data();

      callback({
        success: true,
        post: {
          id: snapshot.id,
          ...post,
        },
        counts: {
          comments: Number(post.commentsCount || post.comments || 0),
          likes: Number(post.likes || 0),
          saves: Number(post.saves || 0),
        },
      });
    },
    (error) => {
      const result = { success: false, error: getSocialErrorMessage(error) };

      if (typeof onError === "function") {
        onError(result);
        return;
      }

      callback(result);
    },
  );
}

export function subscribeLikeStatus(postId, userId, callback, onError) {
  const validation = validatePostUser(postId, userId);

  if (validation.error || typeof callback !== "function") {
    return () => {};
  }

  const likeId = createDocId(validation.userId, validation.postId);

  return onSnapshot(
    doc(db, "likes", likeId),
    (snapshot) => {
      callback({ success: true, isLiked: snapshot.exists() });
    },
    (error) => {
      const result = { success: false, error: getSocialErrorMessage(error) };

      if (typeof onError === "function") {
        onError(result);
        return;
      }

      callback(result);
    },
  );
}

export async function addComment(postId, userId, text, author = {}) {
  const validation = validatePostUser(postId, userId);
  const cleanText = normalizeText(text);
  const displayName = normalizeText(author.displayName);
  const photoURL = normalizeText(author.photoURL);

  if (validation.error) {
    return { success: false, error: validation.error };
  }

  if (!cleanText) {
    return { success: false, error: "Komentar wajib diisi." };
  }

  const postRef = doc(db, "posts", validation.postId);
  const commentRef = doc(collection(db, "comments"));
  const payload = {
    postId: validation.postId,
    userId: validation.userId,
    displayName,
    photoURL,
    text: cleanText,
    createdAt: serverTimestamp(),
  };

  try {
    const transactionResult = await runTransaction(db, async (transaction) => {
      const postSnapshot = await transaction.get(postRef);

      if (!postSnapshot.exists()) {
        throw createSocialError("post-not-found", "Post tidak ditemukan.");
      }

      const post = postSnapshot.data();

      transaction.set(commentRef, payload);
      transaction.update(postRef, {
        commentsCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      return { toUserId: post.userId };
    });

    await createNotification(
      transactionResult.toUserId,
      validation.userId,
      "comment",
      validation.postId,
    );

    return { success: true, comment: { id: commentRef.id, ...payload } };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export async function getComments(postId, limitValue = 50) {
  const cleanPostId = normalizeText(postId);

  if (!cleanPostId) {
    return { success: false, error: "Post ID wajib diisi." };
  }

  try {
    const safeLimit = normalizeLimit(limitValue, 50);
    const snapshot = await getDocs(
      query(
        collection(db, "comments"),
        where("postId", "==", cleanPostId),
        queryLimit(safeLimit),
      ),
    );
    const comments = sortNewestFirst(normalizeQuerySnapshot(snapshot));

    return { success: true, comments };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export function subscribeComments(postId, callback, onError, limitValue = 50) {
  const cleanPostId = normalizeText(postId);

  if (!cleanPostId || typeof callback !== "function") {
    return () => {};
  }

  const safeLimit = normalizeLimit(limitValue, 50);
  const commentsQuery = query(
    collection(db, "comments"),
    where("postId", "==", cleanPostId),
    queryLimit(safeLimit),
  );

  return onSnapshot(
    commentsQuery,
    (snapshot) => {
      callback({
        success: true,
        comments: sortNewestFirst(normalizeQuerySnapshot(snapshot)),
      });
    },
    (error) => {
      const result = { success: false, error: getSocialErrorMessage(error) };

      if (typeof onError === "function") {
        onError(result);
        return;
      }

      callback(result);
    },
  );
}

export async function savePost(postId, userId) {
  const validation = validatePostUser(postId, userId);

  if (validation.error) {
    return { success: false, error: validation.error };
  }

  const saveId = createDocId(validation.userId, validation.postId);
  const saveRef = doc(db, "saves", saveId);
  const postRef = doc(db, "posts", validation.postId);

  try {
    const transactionResult = await runTransaction(db, async (transaction) => {
      const postSnapshot = await transaction.get(postRef);
      const saveSnapshot = await transaction.get(saveRef);

      if (!postSnapshot.exists()) {
        throw createSocialError("post-not-found", "Post tidak ditemukan.");
      }

      if (saveSnapshot.exists()) {
        return { changed: false, toUserId: postSnapshot.data().userId };
      }

      transaction.set(saveRef, {
        userId: validation.userId,
        postId: validation.postId,
        createdAt: serverTimestamp(),
      });
      transaction.update(postRef, {
        saves: increment(1),
        updatedAt: serverTimestamp(),
      });

      return { changed: true, toUserId: postSnapshot.data().userId };
    });

    if (transactionResult.changed) {
      await createNotification(
        transactionResult.toUserId,
        validation.userId,
        "save",
        validation.postId,
      );
    }

    return {
      success: true,
      saved: true,
      changed: transactionResult.changed,
      saveId,
    };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export async function unsavePost(postId, userId) {
  const validation = validatePostUser(postId, userId);

  if (validation.error) {
    return { success: false, error: validation.error };
  }

  const saveId = createDocId(validation.userId, validation.postId);
  const saveRef = doc(db, "saves", saveId);
  const postRef = doc(db, "posts", validation.postId);

  try {
    const transactionResult = await runTransaction(db, async (transaction) => {
      const postSnapshot = await transaction.get(postRef);
      const saveSnapshot = await transaction.get(saveRef);

      if (!postSnapshot.exists()) {
        throw createSocialError("post-not-found", "Post tidak ditemukan.");
      }

      if (!saveSnapshot.exists()) {
        return { changed: false };
      }

      const currentSaves = Number(postSnapshot.data().saves || 0);

      transaction.delete(saveRef);
      transaction.update(postRef, {
        saves: Math.max(currentSaves - 1, 0),
        updatedAt: serverTimestamp(),
      });

      return { changed: true };
    });

    return {
      success: true,
      saved: false,
      changed: transactionResult.changed,
      saveId,
    };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export async function isSaved(postId, userId) {
  const validation = validatePostUser(postId, userId);

  if (validation.error) {
    return { success: false, error: validation.error };
  }

  try {
    const saveId = createDocId(validation.userId, validation.postId);
    const snapshot = await getDoc(doc(db, "saves", saveId));

    return { success: true, isSaved: snapshot.exists() };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export function subscribeSaveStatus(postId, userId, callback, onError) {
  const validation = validatePostUser(postId, userId);

  if (validation.error || typeof callback !== "function") {
    return () => {};
  }

  const saveId = createDocId(validation.userId, validation.postId);

  return onSnapshot(
    doc(db, "saves", saveId),
    (snapshot) => {
      callback({ success: true, isSaved: snapshot.exists() });
    },
    (error) => {
      const result = { success: false, error: getSocialErrorMessage(error) };

      if (typeof onError === "function") {
        onError(result);
        return;
      }

      callback(result);
    },
  );
}
