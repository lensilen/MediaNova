import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { editorStyles as styles } from "./editorStyles";

const frames = Array.from({ length: 9 }, (_, index) => index);
const waveBars = [18, 24, 16, 30, 22, 34, 20, 28, 36, 24, 18, 30];

export function TimelineStrip({
  activeTool = "trim",
  durationLabel = "00:60",
  endLabel = "00:60",
  mediaType = "video",
  onPickTime,
  selectedSecond = 0,
  startLabel = "00:00",
}) {
  const splitMode = activeTool === "split";
  const trimMode = activeTool === "trim" || splitMode;
  const activeFrame = Math.min(
    frames.length - 1,
    Math.max(0, Math.round((selectedSecond / 60) * (frames.length - 1))),
  );

  return (
    <View style={styles.timeline}>
      <View style={styles.timelineTimeRow}>
        <Text style={styles.metaText}>{startLabel}</Text>
        <Text style={styles.metaText}>{durationLabel}</Text>
      </View>

      <View style={styles.timelineEditor}>
        <View style={styles.timelineSideButton}>
          <Ionicons name="volume-medium" size={16} color={colors.primary} />
        </View>

        <View style={styles.clipStack}>
          <View style={styles.clipTrack}>
            {trimMode ? (
              <View style={styles.trimHandle}>
                <Ionicons name="chevron-back" size={18} color={colors.primary} />
              </View>
            ) : null}
            {frames.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.timelineFrame,
                  item === activeFrame ? styles.timelineFrameActive : null,
                ]}
                onPress={() => onPickTime?.(Math.round((item / 8) * 60))}
              >
                <View style={styles.frameShade} />
              </Pressable>
            ))}
            {trimMode ? (
              <View style={styles.addClipButton}>
                <Ionicons name="add" size={22} color={colors.text} />
              </View>
            ) : null}
          </View>

          {mediaType !== "photo" ? (
            <View style={styles.audioTrack}>
              <Ionicons name="musical-notes" size={16} color={colors.primary} />
              <Text numberOfLines={1} style={styles.audioTrackText}>
                Audio
              </Text>
              <View style={styles.waveMiniRow}>
                {waveBars.map((height, index) => (
                  <View
                    key={`${height}-${index}`}
                    style={[styles.waveMiniBar, { height }]}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View
            pointerEvents="none"
            style={[styles.playhead, splitMode ? styles.splitPlayhead : null]}
          >
            <View style={styles.playheadCap} />
          </View>
        </View>
      </View>

      <View style={styles.timelineMeta}>
        <Text style={styles.metaText}>
          {trimMode
            ? `${splitMode ? "Split point" : "Trim range"} ${startLabel} - ${endLabel}`
            : "Preview edit aktif"}
        </Text>
        <Text style={styles.metaText}>{activeTool}</Text>
      </View>
    </View>
  );
}
