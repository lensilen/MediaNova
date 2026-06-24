import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const CACHE_KEYS = {
  feedPosts: "medianova:cache:feedPosts",
  userProfile: (userId) => `medianova:cache:userProfile:${userId}`,
};

const TIMESTAMP_MARKER = "__medianovaTimestamp";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function serializeValue(value) {
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (typeof value.toDate === "function") {
    const date = value.toDate();

    return {
      [TIMESTAMP_MARKER]: true,
      iso: date.toISOString(),
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
    };
  }

  return Object.entries(value).reduce((result, [key, entryValue]) => {
    return {
      ...result,
      [key]: serializeValue(entryValue),
    };
  }, {});
}

function hydrateTimestamp(value) {
  const date = value.iso ? new Date(value.iso) : new Date(0);

  return {
    seconds: value.seconds,
    nanoseconds: value.nanoseconds,
    toDate: () => date,
    toMillis: () => date.getTime(),
  };
}

function deserializeValue(value) {
  if (Array.isArray(value)) {
    return value.map(deserializeValue);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (value[TIMESTAMP_MARKER]) {
    return hydrateTimestamp(value);
  }

  return Object.entries(value).reduce((result, [key, entryValue]) => {
    return {
      ...result,
      [key]: deserializeValue(entryValue),
    };
  }, {});
}

async function readJson(key, fallbackValue) {
  try {
    const rawValue = await AsyncStorage.getItem(key);

    if (!rawValue) {
      return fallbackValue;
    }

    return deserializeValue(JSON.parse(rawValue));
  } catch {
    return fallbackValue;
  }
}

async function writeJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(serializeValue(value)));
}

export async function cacheFeedPosts(posts) {
  const safePosts = Array.isArray(posts) ? posts : [];

  try {
    await writeJson(CACHE_KEYS.feedPosts, {
      posts: safePosts,
      cachedAt: new Date().toISOString(),
    });

    return { success: true, count: safePosts.length };
  } catch {
    return { success: false, error: "Gagal menyimpan cache feed." };
  }
}

export async function getCachedFeedPosts() {
  const cachedFeed = await readJson(CACHE_KEYS.feedPosts, {
    posts: [],
    cachedAt: null,
  });

  return {
    success: true,
    posts: Array.isArray(cachedFeed.posts) ? cachedFeed.posts : [],
    cachedAt: cachedFeed.cachedAt || null,
  };
}

export async function cacheUserProfile(userId, profile) {
  const cleanUserId = normalizeText(userId);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  try {
    await writeJson(CACHE_KEYS.userProfile(cleanUserId), {
      profile,
      cachedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch {
    return { success: false, error: "Gagal menyimpan cache profil." };
  }
}

export async function getCachedUserProfile(userId) {
  const cleanUserId = normalizeText(userId);

  if (!cleanUserId) {
    return { success: false, error: "User ID wajib diisi." };
  }

  const cachedProfile = await readJson(CACHE_KEYS.userProfile(cleanUserId), {
    profile: null,
    cachedAt: null,
  });

  return {
    success: true,
    profile: cachedProfile.profile || null,
    cachedAt: cachedProfile.cachedAt || null,
  };
}

export async function clearCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const medianovaKeys = keys.filter((key) => key.startsWith("medianova:cache:"));

    if (medianovaKeys.length > 0) {
      await AsyncStorage.multiRemove(medianovaKeys);
    }

    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus cache." };
  }
}

export async function getNetworkStatus() {
  const state = await NetInfo.fetch();
  const isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);

  return {
    isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
  };
}

export function subscribeNetworkStatus(callback) {
  return NetInfo.addEventListener((state) => {
    callback({
      isConnected: Boolean(state.isConnected && state.isInternetReachable !== false),
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    });
  });
}
