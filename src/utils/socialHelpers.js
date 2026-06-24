import {
  collection,
  endAt,
  getDocs,
  limit as queryLimit,
  orderBy,
  query,
  startAt,
} from "firebase/firestore";

import { db } from "./firebase";

export const DEFAULT_SEARCH_LIMIT = 20;
export const FALLBACK_SEARCH_LIMIT = 50;

export function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeSearchText(value) {
  return normalizeText(value).toLowerCase();
}

export function normalizeLimit(value, fallback = DEFAULT_SEARCH_LIMIT) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(numericValue), 1), 50);
}

export function createDocId(...parts) {
  return parts.map((part) => normalizeText(part)).join("_");
}

export function normalizeSnapshot(snapshot) {
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export function normalizeQuerySnapshot(snapshot) {
  return snapshot.docs.map(normalizeSnapshot).filter(Boolean);
}

export function createSocialError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function validatePostUser(postId, userId) {
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

export function sortNewestFirst(items) {
  return [...items].sort((first, second) => {
    return toMillis(second.createdAt) - toMillis(first.createdAt);
  });
}

export function uniqueById(items) {
  const map = new Map();

  items.forEach((item) => {
    if (item?.id) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
}

export async function getPrefixMatches(
  collectionName,
  fieldName,
  searchText,
  limitValue,
) {
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

export async function getFallbackMatches(collectionName, matchesSearch, limitValue) {
  const snapshot = await getDocs(
    query(collection(db, collectionName), queryLimit(FALLBACK_SEARCH_LIMIT)),
  );

  return normalizeQuerySnapshot(snapshot).filter(matchesSearch).slice(0, limitValue);
}

export function getSocialErrorMessage(error) {
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
