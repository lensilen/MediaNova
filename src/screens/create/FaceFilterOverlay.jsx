import { Image, Text, View } from "react-native";

import { noSticker } from "./createOptions";
import { createStyles as styles } from "./createStyles";

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function makeStickerStyle(face, sticker) {
  const bounds = face?.bounds;

  if (!bounds || !sticker?.source) return null;

  const width = bounds.width * (sticker.scale || 1.45);
  const height = width / (sticker.aspectRatio || 1);
  const left = clamp(bounds.x + bounds.width / 2 - width / 2, -width * 0.2, 1000);
  const top = clamp(
    bounds.y + bounds.height * (sticker.yOffset || -0.5),
    -height * 0.2,
    1000,
  );

  return {
    width,
    height,
    left,
    top,
    transform: [{ rotate: `${face.rollAngle || 0}deg` }],
  };
}

export function FaceFilterOverlay({ face, selectedSticker = noSticker }) {
  const stickerStyle = makeStickerStyle(face, selectedSticker);
  const stickerActive = selectedSticker.key !== noSticker.key;

  return (
    <View pointerEvents="none" style={styles.faceOverlay}>
      {stickerStyle ? (
        <Image
          resizeMode="contain"
          source={selectedSticker.source}
          style={[styles.faceSticker, stickerStyle]}
        />
      ) : null}
      {stickerActive && !face ? (
        <View style={styles.faceHint}>
          <Text style={styles.faceHintText}>Arahkan wajah ke kamera</Text>
        </View>
      ) : null}
    </View>
  );
}
