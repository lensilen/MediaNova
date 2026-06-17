import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";
import {
  createDocId,
  createSocialError,
  getSocialErrorMessage,
  normalizeText,
} from "./socialHelpers";

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
        following: Number(followerSnapshot.data().following || 0) + 1,
        updatedAt: serverTimestamp(),
      });
      transaction.update(followingRef, {
        followers: Number(followingSnapshot.data().followers || 0) + 1,
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
