import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as queryLimit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
} from "firebase/firestore";

import { db } from "./firebase";
import { cacheFeedPosts, getCachedFeedPosts } from "./cache";
import { createNotification } from "./notifications";

export const POST_TYPES = ["video", "audio", "photo"];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLimit(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 10;
  }

  return Math.min(Math.max(Math.floor(numericValue), 1), 30);
}

function normalizePostSnapshot(snapshot) {
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

function validatePostPayload(userId, type, mediaURL) {
  if (!normalizeText(userId)) {
    return "User wajib login sebelum membuat post.";
  }

  if (!POST_TYPES.includes(type)) {
    return "Tipe post tidak valid.";
  }

  if (!normalizeText(mediaURL)) {
    return "Media URL wajib diisi.";
  }

  return null;
}

function normalizeVisibility(value) {
  const cleanValue = normalizeText(value).toLowerCase();

  return ["everyone", "followers"].includes(cleanValue) ? cleanValue : "everyone";
}

function sanitizePlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((result, [key, nextValue]) => {
    if (nextValue === undefined || nextValue === null) {
      return result;
    }

    if (typeof nextValue === "object" && !Array.isArray(nextValue)) {
      const nestedValue = sanitizePlainObject(nextValue);

      if (Object.keys(nestedValue).length > 0) {
        return { ...result, [key]: nestedValue };
      }

      return result;
    }

    return { ...result, [key]: nextValue };
  }, {});
}

function createHandle(value) {
  return normalizeText(value)
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "");
}

function extractMentions(...values) {
  const text = values.map(normalizeText).join(" ");
  const matches = text.match(/@[a-zA-Z0-9._]+/g) || [];

  return Array.from(new Set(matches.map((item) => item.slice(1).toLowerCase())));
}

async function createMentionNotifications({ fromUserId, mentions, postId }) {
  if (!mentions.length) return;

  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users = snapshot.docs
      .map((userDoc) => ({ id: userDoc.id, ...userDoc.data() }))
      .filter((profile) => {
        const handles = [
          createHandle(profile.email),
          createHandle(profile.displayName),
        ];

        return handles.some((handle) => mentions.includes(handle));
      });

    await Promise.all(
      users.map((profile) =>
        createNotification(profile.id || profile.uid, fromUserId, "mention", postId),
      ),
    );
  } catch {
    // Mention notification is optional and should not block posting.
  }
}

export async function createPost(
  userId,
  type,
  mediaURL,
  thumbnailURL = "",
  caption = "",
  metadata = {},
) {
  const cleanUserId = normalizeText(userId);
  const cleanMediaURL = normalizeText(mediaURL);
  const cleanThumbnailURL = normalizeText(thumbnailURL);
  const cleanCaption = normalizeText(caption);
  const cleanTitle = normalizeText(metadata.title);
  const cleanLocation = normalizeText(metadata.location);
  const author = sanitizePlainObject(metadata.author);
  const visibility = normalizeVisibility(metadata.visibility);
  const editMeta = sanitizePlainObject(metadata.editMeta);
  const mentions = extractMentions(cleanCaption, cleanTitle);
  const validationError = validatePostPayload(cleanUserId, type, cleanMediaURL);

  if (validationError) {
    return { success: false, error: validationError };
  }

  const payload = {
    userId: cleanUserId,
    type,
    mediaURL: cleanMediaURL,
    thumbnailURL: cleanThumbnailURL,
    title: cleanTitle,
    titleLower: cleanTitle.toLowerCase(),
    caption: cleanCaption,
    captionLower: cleanCaption.toLowerCase(),
    username:
      normalizeText(author.username) ||
      createHandle(author.email || author.displayName || cleanUserId),
    displayName: normalizeText(author.displayName),
    photoURL: normalizeText(author.photoURL),
    location: cleanLocation,
    locationLower: cleanLocation.toLowerCase(),
    visibility,
    allowComments: metadata.allowComments !== false,
    editMeta,
    likes: 0,
    saves: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const postRef = await addDoc(collection(db, "posts"), payload);
    await createMentionNotifications({
      fromUserId: cleanUserId,
      mentions,
      postId: postRef.id,
    });

    return {
      success: true,
      post: {
        id: postRef.id,
        ...payload,
      },
    };
  } catch (error) {
    return { success: false, error: getPostErrorMessage(error.code) };
  }
}

export async function getFeedPosts(pageSize = 10, lastDoc = null) {
  const safeLimit = normalizeLimit(pageSize);
  const constraints = [orderBy("createdAt", "desc"), queryLimit(safeLimit)];

  if (lastDoc) {
    constraints.splice(1, 0, startAfter(lastDoc));
  }

  try {
    const postsQuery = query(collection(db, "posts"), ...constraints);
    const snapshot = await getDocs(postsQuery);
    const posts = snapshot.docs.map(normalizePostSnapshot).filter(Boolean);
    const nextLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    if (!lastDoc) {
      await cacheFeedPosts(posts);
    }

    return {
      success: true,
      posts,
      lastDoc: nextLastDoc,
      hasMore: snapshot.docs.length === safeLimit,
    };
  } catch (error) {
    if (!lastDoc) {
      const cachedFeed = await getCachedFeedPosts();

      if (cachedFeed.posts.length > 0) {
        return {
          success: true,
          posts: cachedFeed.posts,
          lastDoc: null,
          hasMore: false,
          fromCache: true,
          cachedAt: cachedFeed.cachedAt,
        };
      }
    }

    return { success: false, error: getPostErrorMessage(error.code) };
  }
}

export async function getUserPosts(userId) {
  const cleanUserId = normalizeText(userId);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  try {
    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", cleanUserId),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(postsQuery);
    const posts = snapshot.docs.map(normalizePostSnapshot).filter(Boolean);

    return { success: true, posts };
  } catch (error) {
    return { success: false, error: getPostErrorMessage(error.code) };
  }
}

export async function getPostById(postId) {
  const cleanPostId = normalizeText(postId);

  if (!cleanPostId) {
    return { success: false, error: "Post ID wajib diisi." };
  }

  try {
    const postSnapshot = await getDoc(doc(db, "posts", cleanPostId));
    const post = normalizePostSnapshot(postSnapshot);

    if (!post) {
      return { success: false, error: "Post tidak ditemukan." };
    }

    return { success: true, post };
  } catch (error) {
    return { success: false, error: getPostErrorMessage(error.code) };
  }
}

export async function deletePost(postId) {
  const cleanPostId = normalizeText(postId);

  if (!cleanPostId) {
    return { success: false, error: "Post ID wajib diisi." };
  }

  try {
    const postRef = doc(db, "posts", cleanPostId);
    const postSnapshot = await getDoc(postRef);

    if (!postSnapshot.exists()) {
      return { success: false, error: "Post tidak ditemukan." };
    }

    await deleteDoc(postRef);

    return { success: true, postId: cleanPostId };
  } catch (error) {
    return { success: false, error: getPostErrorMessage(error.code) };
  }
}

function getPostErrorMessage(code) {
  const messages = {
    "permission-denied":
      "Akses Firestore ditolak. Cek rules atau status login.",
    unavailable: "Firebase sedang tidak tersedia. Coba lagi nanti.",
    "not-found": "Data tidak ditemukan.",
    "failed-precondition":
      "Query Firestore membutuhkan index. Buat index dari link error Firebase.",
    "resource-exhausted": "Kuota Firebase sementara habis.",
    unauthenticated: "Kamu harus login terlebih dahulu.",
  };

  return messages[code] || "Terjadi kesalahan saat memproses post.";
}
