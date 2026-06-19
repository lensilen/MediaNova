import { Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { editorStyles as styles } from "./editorStyles";

const frameHeights = [24, 38, 48, 32, 44, 56, 28, 42, 50, 36, 46, 30];

export function TimelineStrip({ endLabel = "00:60", startLabel = "00:12" }) {
  return (
    <View style={styles.timeline}>
      <View style={styles.timelineTrack}>
        {frameHeights.map((height, index) => (
          <View
            key={`${height}-${index}`}
            style={[
              styles.timelineFrame,
              {
                height,
                backgroundColor: index % 2 ? colors.tertiary : colors.secondary,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.timelineMeta}>
        <Text style={styles.metaText}>{startLabel}</Text>
        <Text style={styles.metaText}>/ {endLabel}</Text>
      </View>
    </View>
  );
}
