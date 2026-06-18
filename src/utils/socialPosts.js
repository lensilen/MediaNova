import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as queryLimit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
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

export async function addComment(postId, userId, text) {
  const validation = validatePostUser(postId, userId);
  const cleanText = normalizeText(text);

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

export async function savePost(postId, userId) {
  const validation = validatePostUser(postId, userId);

  if (validation.error) {
    return { success: false, error: validation.error };
  }

  const saveId = createDocId(validation.userId, validation.postId);
  const saveRef = doc(db, "saves", saveId);
  const postRef = doc(db, "posts", validation.postId);

  try {
    const postSnapshot = await getDoc(postRef);

    if (!postSnapshot.exists()) {
      return { success: false, error: "Post tidak ditemukan." };
    }

    await setDoc(saveRef, {
      userId: validation.userId,
      postId: validation.postId,
      createdAt: serverTimestamp(),
    });

    return { success: true, saved: true, saveId };
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

  try {
    await deleteDoc(doc(db, "saves", saveId));

    return { success: true, saved: false, saveId };
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
