import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { formatTime, waveformBars } from "./createOptions";
import { createStyles as styles } from "./createStyles";

function normalizeMetering(metering) {
  if (typeof metering !== "number") return null;

  return Math.max(0, Math.min(1, (metering + 60) / 60));
}

function animatedBarHeight(baseHeight, index, level, durationMillis, isRecording) {
  if (!isRecording) return Math.max(8, baseHeight * 0.45);

  const fallbackPulse =
    0.45 + Math.abs(Math.sin(durationMillis / 170 + index * 0.78)) * 0.55;
  const audioLevel = level ?? fallbackPulse;
  const localPulse = 0.72 + Math.abs(Math.sin(durationMillis / 130 + index)) * 0.38;

  return Math.max(10, Math.min(58, baseHeight * (0.55 + audioLevel) * localPulse));
}

export function AudioCapturePanel({
  durationMillis = 0,
  isRecording = false,
  metering,
}) {
  const audioSeconds = Math.floor(durationMillis / 1000);
  const level = normalizeMetering(metering);

  return (
    <View style={styles.audioRecorderSurface}>
      <View style={[styles.audioMicBadge, isRecording ? styles.audioMicBadgeLive : null]}>
        <Ionicons
          name={isRecording ? "mic" : "mic-outline"}
          size={34}
          color={isRecording ? colors.onPrimary : colors.primary}
        />
      </View>
      <View style={styles.waveformRow}>
        {waveformBars.map((height, index) => (
          <View
            key={`${height}-${index}`}
            style={[
              styles.waveformBar,
              {
                height: animatedBarHeight(
                  height,
                  index,
                  level,
                  durationMillis,
                  isRecording,
                ),
                backgroundColor:
                  isRecording && index % 2 ? colors.secondary : colors.primary,
                opacity: isRecording ? 1 : 0.45,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.fallbackTitle}>{formatTime(audioSeconds)}</Text>
      {isRecording ? (
        <View style={styles.audioLivePill}>
          <View style={styles.audioLiveDot} />
          <Text style={styles.audioLiveText}>Recording</Text>
        </View>
      ) : null}
      <Text style={styles.fallbackText}>
        {isRecording
          ? "Sedang merekam voice note."
          : "Ready to record audio dengan waveform."}
      </Text>
    </View>
  );
}
