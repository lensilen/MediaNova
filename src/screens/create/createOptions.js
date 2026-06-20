import { Ionicons } from "@expo/vector-icons";

export const mediaModes = [
  { key: "photo", label: "Photo", icon: "image-outline" },
  { key: "video", label: "Video", icon: "videocam-outline" },
  { key: "audio", label: "Audio", icon: "mic-outline" },
];

export const noFilter = { key: "none", label: "", tint: "rgba(255,255,255,0)" };

export const noSticker = { key: "none", label: "None", source: null };

export const stickerOptions = [
  {
    key: "mario-cap",
    label: "Cap",
    source: require("../../assets/faceFilters/mario-cap.png"),
  },
  {
    key: "puppy-dalmatian",
    label: "Puppy",
    source: require("../../assets/faceFilters/puppy-dalmatian.png"),
  },
  {
    key: "flower-crown",
    label: "Flower",
    source: require("../../assets/faceFilters/flower-crown.png"),
  },
  {
    key: "dog-glasses",
    label: "Dog",
    source: require("../../assets/faceFilters/dog-glasses.png"),
  },
  {
    key: "hearts",
    label: "Love",
    source: require("../../assets/faceFilters/hearts.png"),
  },
];

export const filters = [
  { key: "grayscale", label: "Grayscale", tint: "rgba(31,29,28,0.48)" },
  { key: "sepia", label: "Sepia", tint: "rgba(120,79,39,0.36)" },
  { key: "vivid", label: "Vivid", tint: "rgba(86,124,141,0.34)" },
  { key: "warm", label: "Warm", tint: "rgba(217,119,6,0.3)" },
  { key: "cool", label: "Cool", tint: "rgba(47,65,86,0.4)" },
];

export const cameraTools = [
  { key: "timer", label: "Timer", icon: "timer-outline" },
  { key: "flash", label: "Flash", icon: "flash-outline" },
  { key: "filter", label: "Filter", icon: "color-filter-outline" },
  { key: "sticker", label: "Sticker", icon: "happy-outline" },
  { key: "grid", label: "Grid", icon: "grid-outline" },
];

export const flashModes = ["off", "on", "auto"];

export const videoTools = [
  { key: "trim", label: "Trim", icon: "cut-outline" },
  { key: "split", label: "Split", icon: "git-branch-outline" },
  { key: "volume", label: "Volume", icon: "volume-medium-outline" },
  { key: "speed", label: "Speed", icon: "speedometer-outline" },
  { key: "beauty", label: "Beauty", icon: "sparkles-outline" },
  { key: "text", label: "Text", icon: "text-outline" },
  { key: "filters", label: "Filter", icon: "color-filter-outline" },
];

export const audioTools = [
  { key: "trim", label: "Trim", icon: "cut-outline" },
  { key: "split", label: "Split", icon: "git-branch-outline" },
  { key: "volume", label: "Volume", icon: "volume-medium-outline" },
  { key: "speed", label: "Speed", icon: "speedometer-outline" },
];

export const photoTools = [
  { key: "filters", label: "Filter", icon: "color-filter-outline" },
  { key: "sticker", label: "Sticker", icon: "happy-outline" },
  { key: "beauty", label: "Beauty", icon: "sparkles-outline" },
];

export const waveformBars = [
  8, 14, 20, 28, 18, 34, 24, 40, 30, 22, 36, 44, 28, 18, 32, 24, 16, 30, 42,
  26, 18, 34, 22, 14,
];

export function formatTime(seconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const remainingSeconds = String(safeSeconds % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function EditorIcon({ color, name, size = 20 }) {
  return <Ionicons color={color} name={name} size={size} />;
}
