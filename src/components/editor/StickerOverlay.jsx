import { Image, Pressable, StyleSheet } from "react-native";
import { useState } from "react";

import { colors } from "../../constants/theme";
import { noSticker } from "../../screens/create/createOptions";

const positions = [
  { top: 80, left: 32 },
  { top: 150, right: 38 },
  { bottom: 96, left: 54 },
  { bottom: 122, right: 48 },
];

export function StickerOverlay({ sticker = noSticker }) {
  const [positionIndex, setPositionIndex] = useState(0);

  if (!sticker?.source) {
    return null;
  }

  return (
    <Pressable
      onPress={() => setPositionIndex((index) => (index + 1) % positions.length)}
      style={[styles.sticker, positions[positionIndex]]}
    >
      <Image resizeMode="contain" source={sticker.source} style={styles.image} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sticker: {
    position: "absolute",
  },
  image: {
    width: 112,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.text,
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
});
