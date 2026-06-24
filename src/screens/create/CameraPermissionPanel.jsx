import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { createStyles as styles } from "./createStyles";

export function CameraPermissionPanel({ onRequestPermission }) {
  return (
    <View style={styles.cameraFallback}>
      <Ionicons name="camera-outline" size={44} color={colors.primary} />
      <Text style={styles.fallbackTitle}>Akses kamera</Text>
      <Text style={styles.fallbackText}>
        Kamera dipakai untuk foto, video shorts maksimal 60 detik, timer, dan
        filter awal.
      </Text>
      <Pressable style={styles.nextButton} onPress={onRequestPermission}>
        <Text style={styles.nextText}>Izinkan</Text>
      </Pressable>
    </View>
  );
}
