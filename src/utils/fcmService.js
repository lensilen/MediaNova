import { Platform } from "react-native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "./firebase";
import {
  requestNotificationPermission,
  sendLocalNotification,
} from "./notifications";

const FCM_UNAVAILABLE_MESSAGE =
  "FCM native belum tersedia. Pakai development build/APK dengan google-services.json.";

let messagingModulePromise = null;
let backgroundHandlerRegistered = false;

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeData(data) {
  return data && typeof data === "object" ? data : {};
}

function normalizeRemoteMessage(remoteMessage = {}) {
  const notification = remoteMessage.notification || {};

  return {
    body: normalizeText(notification.body || remoteMessage.data?.body),
    data: normalizeData(remoteMessage.data),
    messageId: normalizeText(remoteMessage.messageId),
    rawMessage: remoteMessage,
    sentTime: remoteMessage.sentTime || Date.now(),
    title: normalizeText(notification.title || remoteMessage.data?.title),
  };
}

async function loadMessagingModule() {
  if (Platform.OS === "web") {
    return { success: false, error: FCM_UNAVAILABLE_MESSAGE };
  }

  if (!messagingModulePromise) {
    messagingModulePromise = import("@react-native-firebase/messaging")
      .then((module) => {
        const messagingFactory = module.default || module.messaging;

        if (typeof messagingFactory !== "function") {
          throw new Error("Modul Firebase Messaging tidak valid.");
        }

        return messagingFactory();
      })
      .catch((error) => {
        messagingModulePromise = null;
        throw error;
      });
  }

  try {
    const messaging = await messagingModulePromise;

    return { success: true, messaging };
  } catch (error) {
    return { success: false, error: getFcmErrorMessage(error) };
  }
}

async function registerDeviceForRemoteMessages(messaging) {
  if (typeof messaging.registerDeviceForRemoteMessages !== "function") {
    return;
  }

  if (messaging.isDeviceRegisteredForRemoteMessages === false) {
    await messaging.registerDeviceForRemoteMessages();
  }
}

async function defaultForegroundMessageHandler(message) {
  if (!message.title && !message.body) {
    return;
  }

  await sendLocalNotification(message.title || "MediaNova", message.body, {
    ...message.data,
    messageId: message.messageId,
  });
}

export async function requestFcmPermission() {
  return requestNotificationPermission();
}

export async function getFcmToken() {
  const permissionResult = await requestFcmPermission();

  if (!permissionResult.success) {
    return permissionResult;
  }

  const moduleResult = await loadMessagingModule();

  if (!moduleResult.success) {
    return moduleResult;
  }

  try {
    const { messaging } = moduleResult;

    await registerDeviceForRemoteMessages(messaging);

    const token = normalizeText(await messaging.getToken());

    if (!token) {
      return { success: false, error: "Token FCM kosong." };
    }

    return { success: true, token, tokenType: "fcm" };
  } catch (error) {
    return { success: false, error: getFcmErrorMessage(error) };
  }
}

export async function saveFcmToken(userId, token) {
  const cleanUserId = normalizeText(userId);
  const cleanToken = normalizeText(token);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  if (!cleanToken) {
    return { success: false, error: "Token FCM wajib diisi." };
  }

  try {
    await setDoc(
      doc(db, "users", cleanUserId),
      {
        fcmToken: cleanToken,
        fcmTokenUpdatedAt: serverTimestamp(),
        notificationProvider: "fcm",
        pushToken: cleanToken,
        pushTokenType: "fcm",
        pushTokenUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return { success: true, token: cleanToken, tokenType: "fcm" };
  } catch (error) {
    return { success: false, error: getFcmErrorMessage(error) };
  }
}

export async function registerFcmToken(userId) {
  const tokenResult = await getFcmToken();

  if (!tokenResult.success) {
    return tokenResult;
  }

  const saveResult = await saveFcmToken(userId, tokenResult.token);

  if (!saveResult.success) {
    return saveResult;
  }

  return { ...saveResult, rawToken: tokenResult.token };
}

export function setBackgroundFcmMessageHandler(handler) {
  if (backgroundHandlerRegistered) {
    return;
  }

  backgroundHandlerRegistered = true;

  loadMessagingModule().then((moduleResult) => {
    if (!moduleResult.success) {
      return;
    }

    const { messaging } = moduleResult;

    if (typeof messaging.setBackgroundMessageHandler !== "function") {
      return;
    }

    messaging.setBackgroundMessageHandler(async (remoteMessage) => {
      const message = normalizeRemoteMessage(remoteMessage);

      if (typeof handler === "function") {
        await handler(message, remoteMessage);
      }
    });
  });
}

export async function initializeFcmService(userId, options = {}) {
  const cleanUserId = normalizeText(userId);
  const unsubscribers = [];
  const tokenResult = cleanUserId
    ? await registerFcmToken(cleanUserId)
    : await getFcmToken();
  const moduleResult = await loadMessagingModule();

  if (!moduleResult.success) {
    return { ...moduleResult, tokenResult, unsubscribe: () => {} };
  }

  const { messaging } = moduleResult;

  if (typeof messaging.onTokenRefresh === "function") {
    unsubscribers.push(
      messaging.onTokenRefresh(async (token) => {
        const cleanToken = normalizeText(token);

        if (cleanUserId && cleanToken) {
          await saveFcmToken(cleanUserId, cleanToken);
        }

        if (typeof options.onTokenRefresh === "function") {
          options.onTokenRefresh(cleanToken);
        }
      }),
    );
  }

  if (typeof messaging.onMessage === "function") {
    unsubscribers.push(
      messaging.onMessage(async (remoteMessage) => {
        const message = normalizeRemoteMessage(remoteMessage);

        if (typeof options.onMessage === "function") {
          await options.onMessage(message, remoteMessage);
          return;
        }

        await defaultForegroundMessageHandler(message);
      }),
    );
  }

  if (typeof messaging.onNotificationOpenedApp === "function") {
    unsubscribers.push(
      messaging.onNotificationOpenedApp((remoteMessage) => {
        const message = normalizeRemoteMessage(remoteMessage);

        if (typeof options.onNotificationOpened === "function") {
          options.onNotificationOpened(message, remoteMessage);
        }
      }),
    );
  }

  if (typeof messaging.getInitialNotification === "function") {
    const initialMessage = await messaging.getInitialNotification();

    if (initialMessage && typeof options.onInitialNotification === "function") {
      const message = normalizeRemoteMessage(initialMessage);
      options.onInitialNotification(message, initialMessage);
    }
  }

  return {
    success: true,
    tokenResult,
    unsubscribe: () => {
      unsubscribers.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
    },
  };
}

function getFcmErrorMessage(error) {
  const code = error?.code || "";
  const message = error?.message || "";

  if (
    code.includes("native") ||
    message.includes("Native module") ||
    message.includes("RNFB") ||
    message.includes("not found")
  ) {
    return FCM_UNAVAILABLE_MESSAGE;
  }

  if (code === "messaging/permission-blocked") {
    return "Izin notifikasi diblokir.";
  }

  if (code === "messaging/permission-default") {
    return "Izin notifikasi belum diberikan.";
  }

  return message || "Terjadi kesalahan FCM.";
}
