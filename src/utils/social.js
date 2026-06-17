import {
  collection,
  deleteDoc,
  doc,
  endAt,
  getDoc,
  getDocs,
  increment,
  limit as queryLimit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAt,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

const DEFAULT_SEARCH_LIMIT = 20;
const FALLBACK_SEARCH_LIMIT = 50;

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSearchText(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeLimit(value, fallback = DEFAULT_SEARCH_LIMIT) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(numericValue), 1), 50);
}

function createDocId(...parts) {
  return parts.map((part) => normalizeText(part)).join("_");
}

function normalizeSnapshot(snapshot) {
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

function normalizeQuerySnapshot(snapshot) {
  return snapshot.docs.map(normalizeSnapshot).filter(Boolean);
}

function createSocialError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validatePostUser(postId, userId) {
  const cleanPostId = normalizeText(postId);
  const cleanUserId = normalizeText(userId);

  if (!cleanPostId) {
    return { error: "Post ID wajib diisi." };
  }

  if (!cleanUserId) {
    return { error: "User wajib login terlebih dahulu." };
  }

  return { postId: cleanPostId, userId: cleanUserId };
}

function toMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  return 0;
}

function sortNewestFirst(items) {
  return [...items].sort((first, second) => {
    return toMillis(second.createdAt) - toMillis(first.createdAt);
  });
}

function uniqueById(items) {
  const map = new Map();

  items.forEach((item) => {
    if (item?.id) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
}

async function getPrefixMatches(collectionName, fieldName, searchText, limitValue) {
  const snapshot = await getDocs(
    query(
      collection(db, collectionName),
      orderBy(fieldName),
      startAt(searchText),
      endAt(`${searchText}\uf8ff`),
      queryLimit(limitValue),
    ),
  );

  return normalizeQuerySnapshot(snapshot);
}

async function getFallbackMatches(collectionName, matchesSearch, limitValue) {
  const snapshot = await getDocs(
    query(collection(db, collectionName), queryLimit(FALLBACK_SEARCH_LIMIT)),
  );

  return normalizeQuerySnapshot(snapshot).filter(matchesSearch).slice(0, limitValue);
}

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

      if (likeSnapshot.exists()) {
        return { changed: false };
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

      return { changed: true };
    });

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
    await runTransaction(db, async (transaction) => {
      const postSnapshot = await transaction.get(postRef);

      if (!postSnapshot.exists()) {
        throw createSocialError("post-not-found", "Post tidak ditemukan.");
      }

      transaction.set(commentRef, payload);
      transaction.update(postRef, {
        commentsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    });

    return {
      success: true,
      comment: {
        id: commentRef.id,
        ...payload,
      },
    };
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

export async function followUser(followerId, followingId) {
  const cleanFollowerId = normalizeText(followerId);
  const cleanFollowingId = normalizeText(followingId);

  if (!cleanFollowerId || !cleanFollowingId) {
    return { success: false, error: "User ID follower dan following wajib diisi." };
  }

  if (cleanFollowerId === cleanFollowingId) {
    return { success: false, error: "Kamu tidak bisa follow akun sendiri." };
  }

  const followId = createDocId(cleanFollowerId, cleanFollowingId);
  const followRef = doc(db, "follows", followId);
  const followerRef = doc(db, "users", cleanFollowerId);
  const followingRef = doc(db, "users", cleanFollowingId);

  try {
    const transactionResult = await runTransaction(db, async (transaction) => {
      const followerSnapshot = await transaction.get(followerRef);
      const followingSnapshot = await transaction.get(followingRef);
      const followSnapshot = await transaction.get(followRef);

      if (!followerSnapshot.exists() || !followingSnapshot.exists()) {
        throw createSocialError("user-not-found", "User tidak ditemukan.");
      }

      if (followSnapshot.exists()) {
        return { changed: false };
      }

      transaction.set(followRef, {
        followerId: cleanFollowerId,
        followingId: cleanFollowingId,
        createdAt: serverTimestamp(),
      });
      transaction.update(followerRef, {
        following: increment(1),
        updatedAt: serverTimestamp(),
      });
      transaction.update(followingRef, {
        followers: increment(1),
        updatedAt: serverTimestamp(),
      });

      return { changed: true };
    });

    return {
      success: true,
      following: true,
      changed: transactionResult.changed,
      followId,
    };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export async function unfollowUser(followerId, followingId) {
  const cleanFollowerId = normalizeText(followerId);
  const cleanFollowingId = normalizeText(followingId);

  if (!cleanFollowerId || !cleanFollowingId) {
    return { success: false, error: "User ID follower dan following wajib diisi." };
  }

  const followId = createDocId(cleanFollowerId, cleanFollowingId);
  const followRef = doc(db, "follows", followId);
  const followerRef = doc(db, "users", cleanFollowerId);
  const followingRef = doc(db, "users", cleanFollowingId);

  try {
    const transactionResult = await runTransaction(db, async (transaction) => {
      const followerSnapshot = await transaction.get(followerRef);
      const followingSnapshot = await transaction.get(followingRef);
      const followSnapshot = await transaction.get(followRef);

      if (!followerSnapshot.exists() || !followingSnapshot.exists()) {
        throw createSocialError("user-not-found", "User tidak ditemukan.");
      }

      if (!followSnapshot.exists()) {
        return { changed: false };
      }

      const currentFollowing = Number(followerSnapshot.data().following || 0);
      const currentFollowers = Number(followingSnapshot.data().followers || 0);

      transaction.delete(followRef);
      transaction.update(followerRef, {
        following: Math.max(currentFollowing - 1, 0),
        updatedAt: serverTimestamp(),
      });
      transaction.update(followingRef, {
        followers: Math.max(currentFollowers - 1, 0),
        updatedAt: serverTimestamp(),
      });

      return { changed: true };
    });

    return {
      success: true,
      following: false,
      changed: transactionResult.changed,
      followId,
    };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export async function isFollowing(followerId, followingId) {
  const cleanFollowerId = normalizeText(followerId);
  const cleanFollowingId = normalizeText(followingId);

  if (!cleanFollowerId || !cleanFollowingId) {
    return { success: false, error: "User ID follower dan following wajib diisi." };
  }

  try {
    const followId = createDocId(cleanFollowerId, cleanFollowingId);
    const snapshot = await getDoc(doc(db, "follows", followId));

    return { success: true, isFollowing: snapshot.exists() };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export async function searchUsers(searchTerm, limitValue = DEFAULT_SEARCH_LIMIT) {
  const cleanSearchTerm = normalizeSearchText(searchTerm);

  if (!cleanSearchTerm) {
    return { success: true, users: [] };
  }

  try {
    const safeLimit = normalizeLimit(limitValue);
    const prefixMatches = await getPrefixMatches(
      "users",
      "displayNameLower",
      cleanSearchTerm,
      safeLimit,
    );
    const fallbackMatches =
      prefixMatches.length >= safeLimit
        ? []
        : await getFallbackMatches(
            "users",
            (user) => {
              const displayName = normalizeSearchText(user.displayName);
              const email = normalizeSearchText(user.email);
              const bio = normalizeSearchText(user.bio);

              return (
                displayName.includes(cleanSearchTerm) ||
                email.includes(cleanSearchTerm) ||
                bio.includes(cleanSearchTerm)
              );
            },
            safeLimit,
          );
    const users = uniqueById([...prefixMatches, ...fallbackMatches]).slice(
      0,
      safeLimit,
    );

    return { success: true, users };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export async function searchPosts(searchTerm, limitValue = DEFAULT_SEARCH_LIMIT) {
  const cleanSearchTerm = normalizeSearchText(searchTerm);

  if (!cleanSearchTerm) {
    return { success: true, posts: [] };
  }

  try {
    const safeLimit = normalizeLimit(limitValue);
    const prefixMatches = await getPrefixMatches(
      "posts",
      "captionLower",
      cleanSearchTerm,
      safeLimit,
    );
    const fallbackMatches =
      prefixMatches.length >= safeLimit
        ? []
        : await getFallbackMatches(
            "posts",
            (post) => {
              const caption = normalizeSearchText(post.caption);
              const type = normalizeSearchText(post.type);

              return caption.includes(cleanSearchTerm) || type.includes(cleanSearchTerm);
            },
            safeLimit,
          );
    const posts = sortNewestFirst(
      uniqueById([...prefixMatches, ...fallbackMatches]),
    ).slice(0, safeLimit);

    return { success: true, posts };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

function getSocialErrorMessage(error) {
  const messages = {
    "failed-precondition":
      "Query Firestore membutuhkan index. Buat index dari link error Firebase.",
    "permission-denied": "Akses Firestore ditolak. Cek rules atau status login.",
    "post-not-found": "Post tidak ditemukan.",
    "resource-exhausted": "Kuota Firebase sementara habis.",
    unauthenticated: "Kamu harus login terlebih dahulu.",
    unavailable: "Firebase sedang tidak tersedia. Coba lagi nanti.",
    "user-not-found": "User tidak ditemukan.",
  };

  return messages[error?.code] || error?.message || "Terjadi kesalahan social.";
}
