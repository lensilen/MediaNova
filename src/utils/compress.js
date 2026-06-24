import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as VideoThumbnails from "expo-video-thumbnails";

let videoCompressorModule = null;

function normalizeUri(uri) {
  return typeof uri === "string" ? uri.trim() : "";
}

function normalizeNumber(value, fallback) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
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

async function loadVideoCompressor() {
  if (videoCompressorModule) {
    return videoCompressorModule;
  }

  try {
    const module = await import("react-native-compressor");

    if (!module.Video?.compress) {
      return null;
    }

    videoCompressorModule = module.Video;
    return videoCompressorModule;
  } catch {
    return null;
  }
}

function createVideoCompressionOptions(options = {}) {
  const compressionOptions = {
    compressionMethod: options.compressionMethod || "auto",
    maxSize: normalizeNumber(options.maxSize, 720),
    minimumFileSizeForCompress: normalizeNumber(
      options.minimumFileSizeForCompress,
      10,
    ),
  };

  if (options.bitrate) {
    compressionOptions.bitrate = normalizeNumber(options.bitrate, 0);
  }

  if (options.progressDivider) {
    compressionOptions.progressDivider = normalizeNumber(
      options.progressDivider,
      10,
    );
  }

  if (typeof options.getCancellationId === "function") {
    compressionOptions.getCancellationId = options.getCancellationId;
  }

  if (typeof options.downloadProgress === "function") {
    compressionOptions.downloadProgress = options.downloadProgress;
  }

  if (typeof options.stripAudio === "boolean") {
    compressionOptions.stripAudio = options.stripAudio;
  }

  return compressionOptions;
}

function notifyCompressionProgress(onProgress, progress) {
  if (typeof onProgress !== "function") {
    return;
  }

  const normalizedProgress = Math.max(
    0,
    Math.min(1, normalizeNumber(progress, 0)),
  );
  const percent = Math.max(
    0,
    Math.min(100, Math.round(normalizedProgress * 100)),
  );

  onProgress({
    bytesTransferred: 0,
    totalBytes: 0,
    progress: normalizedProgress,
    percent,
    state: "running",
    phase: "compress",
  });
}

export async function compressVideo(uri, options = {}) {
  const cleanUri = normalizeUri(uri);

  if (!cleanUri) {
    return { success: false, error: "URI video wajib diisi." };
  }

  const info = await getLocalFileInfo(cleanUri);

  if (info.exists === false) {
    return { success: false, error: "File video tidak ditemukan." };
  }

  const Video = await loadVideoCompressor();

  if (!Video) {
    return {
      success: true,
      originalUri: cleanUri,
      uri: cleanUri,
      originalSize: info.size || 0,
      size: info.size || 0,
      didCompress: false,
      skippedReason:
        "Video compressor belum tersedia di runtime ini. Upload pakai file asli.",
    };
  }

  try {
    const compressedUri = normalizeUri(
      await Video.compress(
        cleanUri,
        createVideoCompressionOptions(options),
        (progress) => notifyCompressionProgress(options.onProgress, progress),
      ),
    );
    const resultUri = compressedUri || cleanUri;
    const resultInfo = await getLocalFileInfo(resultUri);

    return {
      success: true,
      originalUri: cleanUri,
      uri: resultUri,
      originalSize: info.size || 0,
      size: resultInfo.size || info.size || 0,
      didCompress: resultUri !== cleanUri,
    };
  } catch {
    return {
      success: true,
      originalUri: cleanUri,
      uri: cleanUri,
      originalSize: info.size || 0,
      size: info.size || 0,
      didCompress: false,
      skippedReason: "Gagal mengompres video. Upload pakai file asli.",
    };
  }
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
