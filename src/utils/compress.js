import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as VideoThumbnails from "expo-video-thumbnails";

function normalizeUri(uri) {
  return typeof uri === "string" ? uri.trim() : "";
}

async function getLocalFileInfo(uri) {
  const cleanUri = normalizeUri(uri);

  if (!cleanUri) {
    return { exists: false, size: 0 };
  }

  try {
    return await FileSystem.getInfoAsync(cleanUri, { size: true });
  } catch {
    return { exists: true, size: 0, uri: cleanUri };
  }
}

export async function compressImage(uri, options = {}) {
  const cleanUri = normalizeUri(uri);

  if (!cleanUri) {
    return { success: false, error: "URI gambar wajib diisi." };
  }

  const {
    compress = 0.75,
    format = SaveFormat.JPEG,
    maxWidth = 1280,
  } = options;

  try {
    const actions = maxWidth ? [{ resize: { width: maxWidth } }] : [];
    const result = await manipulateAsync(cleanUri, actions, {
      compress,
      format,
    });
    const info = await getLocalFileInfo(result.uri);

    return {
      success: true,
      originalUri: cleanUri,
      uri: result.uri,
      width: result.width,
      height: result.height,
      size: info.size || 0,
    };
  } catch {
    return {
      success: false,
      error: "Gagal mengompres gambar.",
    };
  }
}

export async function compressVideo(uri) {
  const cleanUri = normalizeUri(uri);

  if (!cleanUri) {
    return { success: false, error: "URI video wajib diisi." };
  }

  const info = await getLocalFileInfo(cleanUri);

  if (info.exists === false) {
    return { success: false, error: "File video tidak ditemukan." };
  }

  return {
    success: true,
    originalUri: cleanUri,
    uri: cleanUri,
    size: info.size || 0,
    didCompress: false,
  };
}

export async function createVideoThumbnail(uri, options = {}) {
  const cleanUri = normalizeUri(uri);

  if (!cleanUri) {
    return { success: false, error: "URI video wajib diisi." };
  }

  const { time = 1000, quality = 0.8 } = options;

  try {
    const thumbnail = await VideoThumbnails.getThumbnailAsync(cleanUri, {
      time,
      quality,
    });
    const info = await getLocalFileInfo(thumbnail.uri);

    return {
      success: true,
      uri: thumbnail.uri,
      width: thumbnail.width,
      height: thumbnail.height,
      size: info.size || 0,
    };
  } catch {
    return {
      success: false,
      error: "Gagal membuat thumbnail video.",
    };
  }
}
