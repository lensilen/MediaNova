import { decode as decodeBase64, encode as encodeBase64 } from "base-64";
import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import jpeg from "jpeg-js";

const COLOR_FILTERS = ["grayscale", "sepia", "vivid", "warm", "cool"];

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function clampUnit(value) {
  return Math.max(-1, Math.min(1, Number(value) || 0));
}

function base64ToBytes(base64) {
  const binary = decodeBase64(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToBase64(bytes) {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return encodeBase64(binary);
}

function applyBeauty(data, settings = {}) {
  const brightness = clampUnit(settings.brightness) * 36;
  const contrast = 1 + clampUnit(settings.contrast) * 0.35;
  const saturation = 1 + clampUnit(settings.saturation) * 0.45;

  if (!brightness && contrast === 1 && saturation === 1) return;

  for (let index = 0; index < data.length; index += 4) {
    let red = data[index] + brightness;
    let green = data[index + 1] + brightness;
    let blue = data[index + 2] + brightness;
    const gray = red * 0.299 + green * 0.587 + blue * 0.114;

    red = gray + (red - gray) * saturation;
    green = gray + (green - gray) * saturation;
    blue = gray + (blue - gray) * saturation;

    data[index] = clamp((red - 128) * contrast + 128);
    data[index + 1] = clamp((green - 128) * contrast + 128);
    data[index + 2] = clamp((blue - 128) * contrast + 128);
  }
}

function applyPixelFilter(data, filterKey) {
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];

    if (filterKey === "grayscale") {
      const gray = red * 0.299 + green * 0.587 + blue * 0.114;
      data[index] = gray;
      data[index + 1] = gray;
      data[index + 2] = gray;
    } else if (filterKey === "sepia") {
      data[index] = clamp(red * 0.393 + green * 0.769 + blue * 0.189);
      data[index + 1] = clamp(red * 0.349 + green * 0.686 + blue * 0.168);
      data[index + 2] = clamp(red * 0.272 + green * 0.534 + blue * 0.131);
    } else if (filterKey === "vivid") {
      data[index] = clamp(red * 1.14);
      data[index + 1] = clamp(green * 1.1);
      data[index + 2] = clamp(blue * 1.16);
    } else if (filterKey === "warm") {
      data[index] = clamp(red * 1.12 + 10);
      data[index + 1] = clamp(green * 1.04 + 4);
      data[index + 2] = clamp(blue * 0.9);
    } else if (filterKey === "cool") {
      data[index] = clamp(red * 0.9);
      data[index + 1] = clamp(green * 1.03);
      data[index + 2] = clamp(blue * 1.16 + 8);
    }
  }
}

export async function applyPhotoFilter(uri, filterKey = "none", beauty = {}) {
  const normalized = await manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    { base64: true, compress: 0.92, format: SaveFormat.JPEG },
  );

  if (!normalized.base64) {
    return normalized.uri;
  }

  const decoded = jpeg.decode(base64ToBytes(normalized.base64), {
    useTArray: true,
  });

  if (COLOR_FILTERS.includes(filterKey)) {
    applyPixelFilter(decoded.data, filterKey);
  }

  applyBeauty(decoded.data, beauty);

  const encoded = jpeg.encode(
    { data: decoded.data, height: decoded.height, width: decoded.width },
    90,
  );
  const outputUri = `${FileSystem.cacheDirectory}medianova-${filterKey}-${Date.now()}.jpg`;

  await FileSystem.writeAsStringAsync(outputUri, bytesToBase64(encoded.data), {
    encoding: FileSystem.EncodingType.Base64,
  });

  return outputUri;
}
