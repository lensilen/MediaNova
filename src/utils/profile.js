import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { updateProfile as updateAuthProfile } from "firebase/auth";

import { auth, db } from "./firebase";
import { cacheUserProfile, getCachedUserProfile } from "./cache";
import { getPostById } from "./posts";
import { uploadImage } from "./upload";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
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

async function getUsersByIds(userIds) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const users = await Promise.all(
    uniqueIds.map(async (userId) => {
      const snapshot = await getDoc(doc(db, "users", userId));
      return normalizeSnapshot(snapshot);
    }),
  );

  return users.filter(Boolean);
}

export async function getUserProfile(userId) {
  const cleanUserId = normalizeText(userId);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  try {
    const snapshot = await getDoc(doc(db, "users", cleanUserId));
    const profile = normalizeSnapshot(snapshot);

    if (!profile) {
      return { success: false, error: "Profil user tidak ditemukan." };
    }

    await cacheUserProfile(cleanUserId, profile);

    return { success: true, profile };
  } catch (error) {
    const cachedProfile = await getCachedUserProfile(cleanUserId);

    if (cachedProfile.profile) {
      return {
        success: true,
        profile: cachedProfile.profile,
        fromCache: true,
        cachedAt: cachedProfile.cachedAt,
      };
    }

    return { success: false, error: getProfileErrorMessage(error.code) };
  }
}

export async function updateProfile(userId, updates = {}) {
  const cleanUserId = normalizeText(userId);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  const displayName = normalizeText(updates.displayName);
  const bio = normalizeText(updates.bio);
  const photoURL = normalizeText(updates.photoURL);
  const payload = {
    updatedAt: serverTimestamp(),
  };

  if (Object.prototype.hasOwnProperty.call(updates, "displayName")) {
    if (!displayName) {
      return { success: false, error: "Nama wajib diisi." };
    }

    payload.displayName = displayName;
    payload.displayNameLower = displayName.toLowerCase();
  }

  if (Object.prototype.hasOwnProperty.call(updates, "bio")) {
    payload.bio = bio;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "photoURL")) {
    payload.photoURL = photoURL;
  }

  try {
    const userRef = doc(db, "users", cleanUserId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      await setDoc(userRef, {
        uid: cleanUserId,
        displayName: displayName || "User",
        displayNameLower: (displayName || "User").toLowerCase(),
        email: "",
        emailLower: "",
        photoURL,
        bio,
        followers: 0,
        following: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, payload);
    }

    if (auth.currentUser?.uid === cleanUserId) {
      const authUpdates = {};

      if (payload.displayName) {
        authUpdates.displayName = payload.displayName;
      }

      if (Object.prototype.hasOwnProperty.call(payload, "photoURL")) {
        authUpdates.photoURL = payload.photoURL;
      }

      if (Object.keys(authUpdates).length > 0) {
        await updateAuthProfile(auth.currentUser, authUpdates);
      }
    }

    return getUserProfile(cleanUserId);
  } catch (error) {
    return { success: false, error: getProfileErrorMessage(error.code) };
  }
}

export async function uploadProfilePhoto(userId, uri, onProgress) {
  const cleanUserId = normalizeText(userId);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  const uploadResult = await uploadImage(uri, onProgress, {
    folder: `users/${cleanUserId}/profile`,
    compressOptions: {
      compress: 0.8,
      maxWidth: 512,
    },
    metadata: {
      mediaType: "profile-photo",
      userId: cleanUserId,
    },
  });

  if (!uploadResult.success) {
    return uploadResult;
  }

  const updateResult = await updateProfile(cleanUserId, {
    photoURL: uploadResult.downloadURL,
  });

  if (!updateResult.success) {
    return updateResult;
  }

  return {
    success: true,
    photoURL: uploadResult.downloadURL,
    profile: updateResult.profile,
    upload: uploadResult,
  };
}

export async function getFollowers(userId) {
  const cleanUserId = normalizeText(userId);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  try {
    const snapshot = await getDocs(
      query(collection(db, "follows"), where("followingId", "==", cleanUserId)),
    );
    const followerIds = snapshot.docs.map(
      (followDoc) => followDoc.data().followerId,
    );
    const followers = await getUsersByIds(followerIds);

    return { success: true, followers };
  } catch (error) {
    return { success: false, error: getProfileErrorMessage(error.code) };
  }
}

export async function getFollowing(userId) {
  const cleanUserId = normalizeText(userId);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  try {
    const snapshot = await getDocs(
      query(collection(db, "follows"), where("followerId", "==", cleanUserId)),
    );
    const followingIds = snapshot.docs.map(
      (followDoc) => followDoc.data().followingId,
    );
    const following = await getUsersByIds(followingIds);

    return { success: true, following };
  } catch (error) {
    return { success: false, error: getProfileErrorMessage(error.code) };
  }
}

export async function getSavedPosts(userId) {
  const cleanUserId = normalizeText(userId);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  try {
    const snapshot = await getDocs(
      query(collection(db, "saves"), where("userId", "==", cleanUserId)),
    );
    const savedPostIds = snapshot.docs.map((saveDoc) => saveDoc.data().postId);
    const postResults = await Promise.all(savedPostIds.map(getPostById));
    const posts = postResults
      .filter((result) => result.success)
      .map((result) => result.post);

    return { success: true, posts };
  } catch (error) {
    return { success: false, error: getProfileErrorMessage(error.code) };
  }
}

function getProfileErrorMessage(code) {
  const messages = {
    "permission-denied":
      "Akses Firestore ditolak. Cek rules atau status login.",
    unavailable: "Firebase sedang tidak tersedia. Coba lagi nanti.",
    "not-found": "Data tidak ditemukan.",
    "resource-exhausted": "Kuota Firebase sementara habis.",
    unauthenticated: "Kamu harus login terlebih dahulu.",
  };

  return messages[code] || "Terjadi kesalahan saat memproses profil.";
}
