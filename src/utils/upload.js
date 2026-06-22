import * as FileSystem from "expo-file-system/legacy";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

import { storage } from "./firebase";
import { compressImage, compressVideo, createVideoThumbnail } from "./compress";

const TEN_MB = 10 * 1024 * 1024;

const MIME_TYPES = {
  aac: "audio/aac",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  png: "image/png",
  wav: "audio/wav",
  webp: "image/webp",
};

function normalizeUri(uri) {
  return typeof uri === "string" ? uri.trim() : "";
}

function createUploadId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getExtension(uri, fallbackExtension) {
  const cleanUri = normalizeUri(uri).split("?")[0].split("#")[0];
  const fileName = cleanUri.split("/").pop() || "";
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";
  const safeExtension = normalizeUri(extension)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return safeExtension || fallbackExtension;
}

function getContentType(uri, fallbackExtension) {
  const extension = getExtension(uri, fallbackExtension);

  return MIME_TYPES[extension] || "application/octet-stream";
}

function createStoragePath(folder, uri, fallbackExtension) {
  const extension = getExtension(uri, fallbackExtension);
  const cleanFolder =
    normalizeUri(folder).replace(/^\/+|\/+$/g, "") || "uploads";

  return `${cleanFolder}/${createUploadId()}.${extension}`;
}

function normalizeMetadata(metadata = {}) {
  return Object.entries(metadata).reduce((result, [key, value]) => {
    if (value === undefined || value === null) {
      return result;
    }

    return {
      ...result,
      [key]: String(value),
    };
  }, {});
}

async function getFileInfo(uri) {
  try {
    return await FileSystem.getInfoAsync(uri, { size: true });
  } catch {
    return { exists: true, size: 0 };
  }
}

async function uriToBlob(uri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      reject(new TypeError("Network request failed: " + e.message));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
}

function notifyProgress(onProgress, snapshot, phase = "upload") {
  if (typeof onProgress !== "function") {
    return;
  }

  const totalBytes = snapshot.totalBytes || 0;
  const bytesTransferred = snapshot.bytesTransferred || 0;
  const progress = totalBytes > 0 ? bytesTransferred / totalBytes : 0;

  onProgress({
    bytesTransferred,
    totalBytes,
    progress,
    percent: Math.round(progress * 100),
    state: snapshot.state,
    phase,
  });
}

function uploadBlobResumable({
  blob,
  contentType,
  metadata = {},
  onProgress,
  path,
}) {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, blob, {
    contentType,
    customMetadata: normalizeMetadata(metadata),
  });

  return new Promise((resolve) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => notifyProgress(onProgress, snapshot),
      (error) => {
        blob.close?.();
        resolve({
          success: false,
          error: getUploadErrorMessage(error.code),
        });
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          blob.close?.();

          resolve({
            success: true,
            downloadURL,
            url: downloadURL,
            path,
            bytesTransferred: uploadTask.snapshot.bytesTransferred,
            totalBytes: uploadTask.snapshot.totalBytes,
          });
        } catch {
          blob.close?.();
          resolve({
            success: false,
            error: "Upload selesai, tetapi URL download gagal dibuat.",
          });
        }
      },
    );
  });
}

async function uploadFile({
  contentType,
  fallbackExtension,
  folder,
  metadata,
  onProgress,
  uri,
}) {
  const cleanUri = normalizeUri(uri);

  if (!cleanUri) {
    return { success: false, error: "URI file wajib diisi." };
  }

  try {
    const fileInfo = await getFileInfo(cleanUri);

    if (fileInfo.exists === false) {
      return { success: false, error: "File tidak ditemukan." };
    }

    const path = createStoragePath(folder, cleanUri, fallbackExtension);
    const blob = await uriToBlob(cleanUri);

    return uploadBlobResumable({
      blob,
      contentType: contentType || getContentType(cleanUri, fallbackExtension),
      metadata: {
        originalUri: cleanUri,
        size: String(fileInfo.size || 0),
        ...metadata,
      },
      onProgress,
      path,
    });
  } catch {
    return { success: false, error: "Gagal membaca file untuk upload." };
  }
}

export async function uploadChunked(uri, onProgress, options = {}) {
  return uploadFile({
    uri,
    onProgress,
    folder: options.folder || "uploads/chunked",
    fallbackExtension: options.fallbackExtension || "bin",
    contentType: options.contentType,
    metadata: {
      uploadMode: "resumable",
      ...options.metadata,
    },
  });
}

export async function uploadImage(uri, onProgress, options = {}) {
  const compressed = await compressImage(uri, options.compressOptions);

  if (!compressed.success) {
    return compressed;
  }

  const result = await uploadFile({
    uri: compressed.uri,
    onProgress,
    folder: options.folder || "posts/images",
    fallbackExtension: "jpg",
    contentType: "image/jpeg",
    metadata: {
      originalUri: compressed.originalUri,
      width: String(compressed.width || 0),
      height: String(compressed.height || 0),
      ...options.metadata,
    },
  });

  return {
    ...result,
    originalUri: compressed.originalUri,
    uploadUri: compressed.uri,
    width: compressed.width,
    height: compressed.height,
  };
}

export async function uploadAudio(uri, onProgress, options = {}) {
  return uploadChunked(uri, onProgress, {
    folder: options.folder || "posts/audio",
    fallbackExtension: "m4a",
    contentType: options.contentType || getContentType(uri, "m4a"),
    metadata: {
      mediaType: "audio",
      ...options.metadata,
    },
  });
}

export async function uploadVideo(uri, onProgress, options = {}) {
  const compressed = await compressVideo(uri);

  if (!compressed.success) {
    return compressed;
  }

  const uploadMode = compressed.size > TEN_MB ? "resumable-large" : "resumable";
  const videoResult = await uploadChunked(compressed.uri, onProgress, {
    folder: options.folder || "posts/videos",
    fallbackExtension: "mp4",
    contentType: options.contentType || "video/mp4",
    metadata: {
      mediaType: "video",
      uploadMode,
      originalUri: compressed.originalUri,
      ...options.metadata,
    },
  });

  if (!videoResult.success) {
    return videoResult;
  }

  const thumbnail = await createVideoThumbnail(compressed.uri);
  let thumbnailResult = { success: false, downloadURL: "", url: "" };

  if (thumbnail.success) {
    thumbnailResult = await uploadFile({
      uri: thumbnail.uri,
      folder: options.thumbnailFolder || "posts/thumbnails",
      fallbackExtension: "jpg",
      contentType: "image/jpeg",
      metadata: {
        mediaType: "video-thumbnail",
        videoPath: videoResult.path,
      },
    });
  }

  return {
    ...videoResult,
    originalUri: compressed.originalUri,
    uploadUri: compressed.uri,
    thumbnailUri: thumbnail.success ? thumbnail.uri : "",
    thumbnailURL: thumbnailResult.success ? thumbnailResult.downloadURL : "",
    thumbnailPath: thumbnailResult.success ? thumbnailResult.path : "",
  };
}

function getUploadErrorMessage(code) {
  const messages = {
    "storage/canceled": "Upload dibatalkan.",
    "storage/object-not-found": "File upload tidak ditemukan.",
    "storage/quota-exceeded": "Kuota Firebase Storage habis.",
    "storage/retry-limit-exceeded": "Upload terlalu lama. Coba lagi.",
    "storage/unauthenticated": "Kamu harus login sebelum upload.",
    "storage/unauthorized": "Akses upload ditolak. Cek Storage rules.",
  };

  return messages[code] || "Upload gagal. Coba lagi.";
}
