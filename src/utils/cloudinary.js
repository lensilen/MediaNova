const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const MIME_TYPES = {
  aac: "audio/aac",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  m4a: "audio/mp4",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  png: "image/png",
  wav: "audio/wav",
  webp: "image/webp",
};

const filterEffects = {
  cool: "e_blue:18",
  grayscale: "e_grayscale",
  sepia: "e_sepia:70",
  vivid: "e_vibrance:55",
  warm: "e_red:18",
};

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function getExtension(uri, fallback = "mp4") {
  const cleanUri = cleanText(uri).split("?")[0].split("#")[0];
  const fileName = cleanUri.split("/").pop() || "";
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";

  return (
    cleanText(extension)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || fallback
  );
}

function getMimeType(uri, fallback = "mp4") {
  const extension = getExtension(uri, fallback);
  return MIME_TYPES[extension] || "application/octet-stream";
}

function getUploadUrl(resourceType = "auto") {
  return `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
}

function getResourceType(mediaType) {
  if (mediaType === "photo") return "image";
  if (mediaType === "audio") return "video";
  if (mediaType === "video") return "video";
  return "auto";
}

function getFallbackExtension(mediaType) {
  if (mediaType === "photo") return "jpg";
  if (mediaType === "audio") return "m4a";
  return "mp4";
}

function normalizeMetadata(metadata = {}) {
  return Object.entries(metadata).reduce((result, [key, value]) => {
    if (value === undefined || value === null || value === "") return result;
    return { ...result, [key]: String(value) };
  }, {});
}

function createContextValue(metadata = {}) {
  return Object.entries(metadata)
    .map(([key, value]) => {
      const safeKey = cleanText(key).replace(/[=|]/g, "");
      const safeValue = cleanText(value).replace(/[=|]/g, " ");
      return safeKey && safeValue ? `${safeKey}=${safeValue}` : "";
    })
    .filter(Boolean)
    .join("|");
}

function notifyProgress(onProgress, loaded, total, phase = "upload") {
  if (typeof onProgress !== "function") return;

  const safeTotal = Math.max(total || 0, 0);
  const safeLoaded = Math.max(loaded || 0, 0);
  const progress = safeTotal > 0 ? safeLoaded / safeTotal : 0;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percent = Math.max(0, Math.min(100, Math.round(clampedProgress * 100)));

  onProgress({
    bytesTransferred: safeLoaded,
    percent,
    phase,
    progress: clampedProgress,
    state: "running",
    totalBytes: safeTotal,
  });
}

function encodeOverlayText(text) {
  return encodeURIComponent(text)
    .replace(/%20/g, "%20")
    .replace(/,/g, "%2C")
    .replace(/\//g, "%2F");
}

function mapSignedEffect(value, max = 60) {
  return Math.round(cleanNumber(value) * max);
}

function buildVideoTransforms(metadata = {}) {
  const transforms = ["c_fill,g_auto,h_1280,w_720", "q_auto"];
  const trimStart = cleanNumber(metadata.trimStart, 0);
  const trimEnd = cleanNumber(metadata.trimEnd, 0);
  const brightness = mapSignedEffect(metadata.brightness, 55);
  const contrast = mapSignedEffect(metadata.contrast, 45);
  const saturation = mapSignedEffect(metadata.saturation, 70);
  const speed = cleanNumber(metadata.speed, 1);
  const volume = cleanNumber(metadata.volume, 1);
  const overlayText = cleanText(metadata.overlayText);
  const filter = cleanText(metadata.filter);

  if (trimStart > 0) transforms.push(`so_${trimStart}`);
  if (trimEnd > trimStart) transforms.push(`eo_${trimEnd}`);
  if (filterEffects[filter]) transforms.push(filterEffects[filter]);
  if (brightness) transforms.push(`e_brightness:${brightness}`);
  if (contrast) transforms.push(`e_contrast:${contrast}`);
  if (saturation) transforms.push(`e_saturation:${saturation}`);
  if (speed !== 1)
    transforms.push(`e_accelerate:${Math.round((speed - 1) * 100)}`);
  if (volume !== 1) transforms.push(`e_volume:${Math.round(volume * 100)}`);
  if (overlayText) {
    transforms.push(
      `l_text:Arial_48_bold:${encodeOverlayText(overlayText)},co_white,g_south_west,x_40,y_120`,
    );
  }

  return transforms.join(",");
}

function buildImageTransforms(metadata = {}) {
  const transforms = ["c_limit,w_1280", "q_auto"];
  const filter = cleanText(metadata.filter);
  const brightness = mapSignedEffect(metadata.brightness, 55);
  const contrast = mapSignedEffect(metadata.contrast, 45);
  const saturation = mapSignedEffect(metadata.saturation, 70);

  if (filterEffects[filter]) transforms.push(filterEffects[filter]);
  if (brightness) transforms.push(`e_brightness:${brightness}`);
  if (contrast) transforms.push(`e_contrast:${contrast}`);
  if (saturation) transforms.push(`e_saturation:${saturation}`);

  return transforms.join(",");
}

function addTransformToUrl(url, transform) {
  if (!url || !transform) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

export function isCloudinaryConfigured() {
  return Boolean(cleanText(cloudName) && cleanText(uploadPreset));
}

export function createCloudinaryDeliveryUrl(
  uploadResult,
  mediaType,
  metadata = {},
) {
  const url = uploadResult?.secure_url || uploadResult?.downloadURL || "";

  if (!url) return "";
  if (mediaType === "video")
    return addTransformToUrl(url, buildVideoTransforms(metadata));
  if (mediaType === "photo")
    return addTransformToUrl(url, buildImageTransforms(metadata));

  return url;
}

export function createCloudinaryVideoThumbnail(uploadResult) {
  const url = uploadResult?.secure_url || "";

  if (!url) return "";

  return url
    .replace(
      "/video/upload/",
      "/video/upload/c_fill,g_auto,h_720,w_720,so_1,q_auto/",
    )
    .replace(/\.[a-z0-9]+($|\?)/i, ".jpg$1");
}

export async function uploadToCloudinary(
  uri,
  mediaType,
  onProgress,
  options = {},
) {
  if (!isCloudinaryConfigured()) {
    return { success: false, error: "Cloudinary belum dikonfigurasi." };
  }

  const cleanUri = cleanText(uri);

  if (!cleanUri) {
    return { success: false, error: "URI media wajib diisi." };
  }

  const fallbackExtension = getFallbackExtension(mediaType);
  const extension = getExtension(cleanUri, fallbackExtension);
  const metadata = normalizeMetadata(options.metadata);
  const resourceType = getResourceType(mediaType);
  const body = new FormData();

  body.append("file", {
    name: `medianova-${Date.now()}.${extension}`,
    type: getMimeType(cleanUri, fallbackExtension),
    uri: cleanUri,
  });
  body.append("upload_preset", uploadPreset);
  body.append("folder", options.folder || "medianova/posts");

  const context = createContextValue(metadata);

  if (context) {
    body.append("context", context);
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      notifyProgress(onProgress, event.loaded || 0, event.total || 0);
    };

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText || "{}");

        if (xhr.status < 200 || xhr.status >= 300) {
          resolve({
            success: false,
            error: response?.error?.message || "Upload Cloudinary gagal.",
          });
          return;
        }

        const deliveryURL = createCloudinaryDeliveryUrl(
          response,
          mediaType,
          metadata,
        );
        const thumbnailURL =
          mediaType === "video" ? createCloudinaryVideoThumbnail(response) : "";

        notifyProgress(onProgress, 1, 1);
        resolve({
          success: true,
          bytesTransferred: response.bytes || 0,
          cloudinary: response,
          downloadURL: deliveryURL || response.secure_url,
          format: response.format,
          originalURL: response.secure_url,
          path: response.public_id,
          publicId: response.public_id,
          resourceType: response.resource_type,
          thumbnailURL,
          totalBytes: response.bytes || 0,
          url: deliveryURL || response.secure_url,
        });
      } catch {
        resolve({
          success: false,
          error: "Response Cloudinary tidak terbaca.",
        });
      }
    };

    xhr.onerror = () => {
      resolve({ success: false, error: "Koneksi upload Cloudinary gagal." });
    };

    xhr.open("POST", getUploadUrl(resourceType));
    xhr.send(body);
  });
}
