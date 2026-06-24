import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { cameraTools } from "./createOptions";
import { createStyles as styles } from "./createStyles";

export function CreateToolOverlay({
  activeRecording,
  activeTools,
  filterLabel,
  flashMode,
  formattedRecordTime,
  isCountingDown,
  onFlipCamera,
  onToolPress,
  stickerLabel,
  timerSeconds,
}) {
  return (
    <>
      <View style={styles.topOverlay}>
        {activeRecording ? (
          <View style={styles.timerPill}>
            <Text style={styles.timerText}>{formattedRecordTime}</Text>
          </View>
        ) : (
          <View />
        )}
        <Pressable style={styles.sideTool} onPress={onFlipCamera}>
          <Ionicons name="camera-reverse-outline" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.sideTools}>
        {cameraTools.map((tool) => (
          <Pressable
            key={tool.key}
            onPress={() => onToolPress(tool.key)}
            style={[
              styles.sideTool,
              activeTools.includes(tool.key) ? styles.sideToolActive : null,
            ]}
          >
            <Ionicons name={tool.icon} size={18} color="#FFFFFF" />
            {tool.key === "timer" && timerSeconds > 0 && !isCountingDown ? (
              <View style={styles.sideToolBadge}>
                <Text style={styles.sideToolBadgeText}>{timerSeconds}s</Text>
              </View>
            ) : null}
            {tool.key === "flash" && flashMode !== "off" ? (
              <View style={styles.sideToolBadge}>
                <Text style={styles.sideToolBadgeText}>
                  {flashMode === "auto" ? "A" : "ON"}
                </Text>
              </View>
            ) : null}
            {tool.key === "filter" && filterLabel ? (
              <View style={styles.sideToolBadge}>
                <Text style={styles.sideToolBadgeText}>{filterLabel[0]}</Text>
              </View>
            ) : null}
            {tool.key === "sticker" && stickerLabel ? (
              <View style={styles.sideToolBadge}>
                <Text style={styles.sideToolBadgeText}>{stickerLabel[0]}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
    </>
  );
}
