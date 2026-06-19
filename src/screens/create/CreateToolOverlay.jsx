import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { cameraTools } from "./createOptions";
import { createStyles as styles } from "./createStyles";

export function CreateToolOverlay({
  countdown,
  formattedRecordTime,
  onFlipCamera,
  onToolPress,
  selectedFilter,
}) {
  return (
    <>
      <View style={styles.topOverlay}>
        <View style={styles.timerPill}>
          <Text style={styles.timerText}>
            {countdown ? countdown : formattedRecordTime}
          </Text>
        </View>
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
              tool.key === "filter" && selectedFilter.key !== "normal"
                ? styles.sideToolActive
                : null,
            ]}
          >
            <Ionicons name={tool.icon} size={18} color="#FFFFFF" />
          </Pressable>
        ))}
      </View>
    </>
  );
}
