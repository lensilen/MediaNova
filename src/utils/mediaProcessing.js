import * as FileSystem from "expo-file-system/legacy";

const COLOR_FILTERS = {
  cool: "eq=contrast=1.04:saturation=1.08:gamma_b=1.12",
  grayscale: "format=gray",
  sepia:
    "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
  vivid: "eq=contrast=1.12:saturation=1.35",
  warm: "eq=contrast=1.04:saturation=1.08:gamma_r=1.12",
};

function getFFmpeg() {
  const kit = require("ffmpeg-kit-react-native");
  return {
    FFmpegKit: kit.FFmpegKit,
    ReturnCode: kit.ReturnCode,
  };
}

function filePath(uri) {
  return uri?.startsWith("file://") ? uri.replace("file://", "") : uri;
}

function cachePath(prefix, extension) {
  const base = FileSystem.cacheDirectory.replace("file://", "");
  return `${base}${prefix}-${Date.now()}.${extension}`;
}

function clampNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function atempoChain(speed) {
  let nextSpeed = Math.max(0.5, Math.min(2, speed || 1));
  const parts = [];

  while (nextSpeed > 2) {
    parts.push("atempo=2");
    nextSpeed /= 2;
  }

  while (nextSpeed < 0.5) {
    parts.push("atempo=0.5");
    nextSpeed *= 2;
  }

  parts.push(`atempo=${nextSpeed.toFixed(2)}`);
  return parts.join(",");
}

function escapeDrawText(text = "") {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/\n/g, " ");
}

async function runFFmpeg(args) {
  const { FFmpegKit, ReturnCode } = getFFmpeg();
  const session = await FFmpegKit.executeWithArguments(args);
  const code = await session.getReturnCode();

  if (!ReturnCode.isSuccess(code)) {
    const logs = await session.getAllLogsAsString();
    throw new Error(logs || "FFmpeg gagal memproses media.");
  }
}

function editDuration(start, end) {
  const trimStart = Math.max(0, clampNumber(start));
  const trimEnd = Math.max(trimStart + 1, clampNumber(end, 60));
  return { duration: trimEnd - trimStart, trimStart };
}

export async function processAudioEdit(uri, edit = {}) {
  const { duration, trimStart } = editDuration(edit.trimStart, edit.trimEnd);
  const speed = clampNumber(edit.speed, 1);
  const volume = clampNumber(edit.volume, 1);
  const output = cachePath("medianova-audio", "m4a");
  const audioFilters = [`volume=${Math.max(0, volume).toFixed(2)}`];

  if (speed !== 1) audioFilters.push(atempoChain(speed));

  await runFFmpeg([
    "-y",
    "-ss",
    String(trimStart),
    "-t",
    String(duration),
    "-i",
    filePath(uri),
    "-vn",
    "-af",
    audioFilters.join(","),
    "-c:a",
    "aac",
    output,
  ]);

  return `file://${output}`;
}

export async function processVideoEdit(uri, edit = {}) {
  const { duration, trimStart } = editDuration(edit.trimStart, edit.trimEnd);
  const speed = clampNumber(edit.speed, 1);
  const output = cachePath("medianova-video", "mp4");
  const videoFilters = [];
  const audioFilters = [`volume=${Math.max(0, clampNumber(edit.volume, 1)).toFixed(2)}`];
  const brightness = clampNumber(edit.brightness);
  const contrast = 1 + clampNumber(edit.contrast) * 0.35;
  const saturation = 1 + clampNumber(edit.saturation) * 0.45;

  if (COLOR_FILTERS[edit.filter]) videoFilters.push(COLOR_FILTERS[edit.filter]);
  if (brightness || contrast !== 1 || saturation !== 1) {
    videoFilters.push(
      `eq=brightness=${(brightness * 0.16).toFixed(2)}:contrast=${contrast.toFixed(2)}:saturation=${saturation.toFixed(2)}`,
    );
  }
  if (speed !== 1) {
    videoFilters.push(`setpts=${(1 / speed).toFixed(3)}*PTS`);
    audioFilters.push(atempoChain(speed));
  }
  if (edit.overlayText) {
    const textX = Math.max(0.05, Math.min(0.85, clampNumber(edit.textX, 22) / 320));
    const textY = Math.max(0.05, Math.min(0.85, clampNumber(edit.textY, 170) / 360));
    const textSize = Math.max(14, Math.min(42, clampNumber(edit.textSize, 24)));
    const textColor = String(edit.textColor || "#FFFFFF").replace("#", "0x");

    videoFilters.push(
      `drawtext=text='${escapeDrawText(edit.overlayText)}':fontcolor=${textColor}:fontsize=${textSize}:x=w*${textX.toFixed(2)}:y=h*${textY.toFixed(2)}:box=1:boxcolor=black@0.28:boxborderw=8`,
    );
  }

  const args = [
    "-y",
    "-ss",
    String(trimStart),
    "-t",
    String(duration),
    "-i",
    filePath(uri),
  ];

  if (videoFilters.length) args.push("-vf", videoFilters.join(","));
  if (audioFilters.length) args.push("-af", audioFilters.join(","));

  args.push("-c:v", "mpeg4", "-c:a", "aac", "-movflags", "+faststart", output);

  await runFFmpeg(args);
  return `file://${output}`;
}
