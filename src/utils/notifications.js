import { Platform } from "react-native";
import * as Device from "expo-device";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit as queryLimit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

const NOTIFICATION_TYPES = ["like", "comment", "follow"];
const DEFAULT_NOTIFICATION_LIMIT = 50;
const EXPO_GO_NOTIFICATION_MESSAGE =
  "Notifikasi masih local dulu untuk Expo Go.";

let notificationsModule = null;

async function loadNotificationsModule() {
  if (notificationsModule) {
    return { success: true, Notifications: notificationsModule };
  }

  try {
    const Notifications = await import("expo-notifications");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    notificationsModule = Notifications;

    return { success: true, Notifications };
  } catch {
    return {
      success: false,
      error: EXPO_GO_NOTIFICATION_MESSAGE,
    };
  }
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLimit(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_NOTIFICATION_LIMIT;
  }

  return Math.min(Math.max(Math.floor(numericValue), 1), 100);
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

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return { success: true };
  }

  const moduleResult = await loadNotificationsModule();

  if (!moduleResult.success) {
    return moduleResult;
  }

  const { Notifications } = moduleResult;

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#A855F7",
  });

  return { success: true };
}

export async function requestNotificationPermission() {
  try {
    const moduleResult = await loadNotificationsModule();

    if (!moduleResult.success) {
      return moduleResult;
    }

    const channelResult = await ensureAndroidChannel();

    if (!channelResult.success) {
      return channelResult;
    }

    const { Notifications } = moduleResult;

    const existingPermission = await Notifications.getPermissionsAsync();
    let finalStatus = existingPermission.status;

    if (finalStatus !== "granted") {
      const requestedPermission = await Notifications.requestPermissionsAsync();
      finalStatus = requestedPermission.status;
    }

    if (finalStatus !== "granted") {
      return {
        success: false,
        status: finalStatus,
        error: "Izin notifikasi belum diberikan.",
      };
    }

    return { success: true, status: finalStatus };
  } catch (error) {
    return { success: false, error: getNotificationErrorMessage(error.code) };
  }
}

export async function getDevicePushToken() {
  const permission = await requestNotificationPermission();

  if (!permission.success) {
    return permission;
  }

  if (!Device.isDevice) {
    return {
      success: false,
      error: "Push token hanya tersedia di device fisik.",
    };
  }

  try {
    const moduleResult = await loadNotificationsModule();

    if (!moduleResult.success) {
      return moduleResult;
    }

    const { Notifications } = moduleResult;
    const tokenResult = await Notifications.getDevicePushTokenAsync();

    return {
      success: true,
      token: String(tokenResult.data || ""),
      tokenType: tokenResult.type,
      rawToken: tokenResult,
    };
  } catch (error) {
    return { success: false, error: getNotificationErrorMessage(error.code) };
  }
}

export async function saveTokenToFirestore(userId, token) {
  const cleanUserId = normalizeText(userId);
  const tokenValue =
    typeof token === "string" ? normalizeText(token) : normalizeText(token?.data);
  const tokenType = typeof token === "string" ? "device" : token?.type || "device";

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  if (!tokenValue) {
    return { success: false, error: "Token notifikasi wajib diisi." };
  }

  try {
    await setDoc(
      doc(db, "users", cleanUserId),
      {
        pushToken: tokenValue,
        pushTokenType: tokenType,
        pushTokenUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return { success: true, token: tokenValue, tokenType };
  } catch (error) {
    return { success: false, error: getNotificationErrorMessage(error.code) };
  }
}

export async function createNotification(toUserId, fromUserId, type, postId = "") {
  const cleanToUserId = normalizeText(toUserId);
  const cleanFromUserId = normalizeText(fromUserId);
  const cleanPostId = normalizeText(postId);

  if (!cleanToUserId || !cleanFromUserId) {
    return { success: false, error: "User ID notifikasi wajib diisi." };
  }

  if (cleanToUserId === cleanFromUserId) {
    return { success: true, skipped: true };
  }

  if (!NOTIFICATION_TYPES.includes(type)) {
    return { success: false, error: "Tipe notifikasi tidak valid." };
  }

  const payload = {
    toUserId: cleanToUserId,
    fromUserId: cleanFromUserId,
    type,
    read: false,
    createdAt: serverTimestamp(),
  };

  if (cleanPostId) {
    payload.postId = cleanPostId;
  }

  try {
    const notificationRef = await addDoc(collection(db, "notifications"), payload);

    return {
      success: true,
      notification: {
        id: notificationRef.id,
        ...payload,
      },
    };
  } catch (error) {
    return { success: false, error: getNotificationErrorMessage(error.code) };
  }
}

export async function getNotifications(userId, limitValue = DEFAULT_NOTIFICATION_LIMIT) {
  const cleanUserId = normalizeText(userId);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  try {
    const safeLimit = normalizeLimit(limitValue);
    const snapshot = await getDocs(
      query(
        collection(db, "notifications"),
        where("toUserId", "==", cleanUserId),
        queryLimit(safeLimit),
      ),
    );
    const notifications = sortNewestFirst(
      snapshot.docs.map(normalizeSnapshot).filter(Boolean),
    );

    return { success: true, notifications };
  } catch (error) {
    return { success: false, error: getNotificationErrorMessage(error.code) };
  }
}

export async function markNotificationAsRead(notificationId) {
  const cleanNotificationId = normalizeText(notificationId);

  if (!cleanNotificationId) {
    return { success: false, error: "Notification ID wajib diisi." };
  }

  try {
    await updateDoc(doc(db, "notifications", cleanNotificationId), {
      read: true,
      readAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, notificationId: cleanNotificationId };
  } catch (error) {
    return { success: false, error: getNotificationErrorMessage(error.code) };
  }
}

export async function getUnreadCount(userId) {
  const cleanUserId = normalizeText(userId);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  try {
    const snapshot = await getDocs(
      query(
        collection(db, "notifications"),
        where("toUserId", "==", cleanUserId),
      ),
    );
    const unreadCount = snapshot.docs.filter((notificationDoc) => {
      return notificationDoc.data().read === false;
    }).length;

    return { success: true, count: unreadCount };
  } catch (error) {
    return { success: false, error: getNotificationErrorMessage(error.code) };
  }
}

export async function sendLocalNotification(title, body, data = {}) {
  const cleanTitle = normalizeText(title);
  const cleanBody = normalizeText(body);

  if (!cleanTitle || !cleanBody) {
    return { success: false, error: "Judul dan isi notifikasi wajib diisi." };
  }

  try {
    const moduleResult = await loadNotificationsModule();

    if (!moduleResult.success) {
      return moduleResult;
    }

    const channelResult = await ensureAndroidChannel();

    if (!channelResult.success) {
      return channelResult;
    }

    const { Notifications } = moduleResult;
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: cleanTitle,
        body: cleanBody,
        data,
      },
      trigger: null,
    });

    return { success: true, identifier };
  } catch (error) {
    return { success: false, error: getNotificationErrorMessage(error.code) };
  }
}

function getNotificationErrorMessage(code) {
  const messages = {
    "ERR_NOTIFICATIONS_DEVICE_ID": "Device ID notifikasi gagal dibuat.",
    "ERR_NOTIFICATIONS_PERMISSION_DENIED": "Izin notifikasi ditolak.",
    "permission-denied": "Akses Firestore ditolak. Cek rules atau status login.",
    unavailable: "Firebase sedang tidak tersedia. Coba lagi nanti.",
    unauthenticated: "Kamu harus login terlebih dahulu.",
  };

  return messages[code] || "Terjadi kesalahan notifikasi.";
}
