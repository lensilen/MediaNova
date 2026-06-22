import { Image, Pressable, StyleSheet } from "react-native";
import { useState } from "react";

import { noSticker } from "../../screens/create/createOptions";

export function StickerOverlay({ compact = false, sticker = noSticker }) {
  const [positionIndex, setPositionIndex] = useState(0);

  if (!sticker?.source) return null;

  return (
    <Pressable
      disabled={compact}
      onPress={() => setPositionIndex((index) => (index + 1) % positions.length)}
      style={[
        styles.sticker,
        compact ? styles.compactSticker : positions[positionIndex],
      ]}
    >
      <Image resizeMode="contain" source={sticker.source} style={styles.image} />
    </Pressable>
  );
}

const positions = [
  { top: 38, alignSelf: "center" },
  { top: 80, left: 32 },
  { top: 150, right: 38 },
  { bottom: 96, left: 54 },
];

const styles = StyleSheet.create({
  sticker: {
    position: "absolute",
    zIndex: 4,
    width: "70%",
    height: 150,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  compactSticker: {
    top: 2,
    alignSelf: "center",
    height: 36,
    width: "84%",
  },
});
