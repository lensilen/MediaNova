import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useState } from "react";

import { colors } from "../../constants/theme";

const positions = [
  { top: 80, left: 32 },
  { top: 150, right: 38 },
  { bottom: 96, left: 54 },
  { bottom: 122, right: 48 },
];

export function StickerOverlay({ enabled = false, icon = "sparkles" }) {
  const [positionIndex, setPositionIndex] = useState(0);

  if (!enabled) {
    return null;
  }

  return (
    <Pressable
      onPress={() => setPositionIndex((index) => (index + 1) % positions.length)}
      style={[styles.sticker, positions[positionIndex]]}
    >
      <View style={styles.badge}>
        <Ionicons name={icon} size={24} color={colors.onPrimary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sticker: {
    position: "absolute",
  },
  badge: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.tertiary,
  },
});
