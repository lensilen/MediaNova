import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { formatTime, waveformBars } from "./createOptions";
import { createStyles as styles } from "./createStyles";

export function AudioCapturePanel({ durationMillis = 0, isRecording = false }) {
  const audioSeconds = Math.floor(durationMillis / 1000);

  return (
    <View style={styles.cameraFallback}>
      <Ionicons name="mic-circle" size={58} color={colors.primary} />
      <View style={styles.waveformRow}>
        {waveformBars.map((height, index) => (
          <View
            key={`${height}-${index}`}
            style={[
              styles.waveformBar,
              {
                height,
                backgroundColor: isRecording ? colors.secondary : colors.tertiary,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.fallbackTitle}>{formatTime(audioSeconds)}</Text>
      <Text style={styles.fallbackText}>
        {isRecording
          ? "Sedang merekam voice note."
          : "Ready to record audio dengan waveform."}
      </Text>
    </View>
  );
}
