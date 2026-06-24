import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors } from "../../constants/theme";
import { editorStyles as styles } from "./editorStyles";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EditorToolBar({ activeTool, onSelectTool, tools }) {
  return (
    <View style={styles.toolRow}>
      {tools.map((tool) => {
        const active = activeTool === tool.key;

        return (
          <ToolButton
            active={active}
            key={tool.key}
            onPress={() => onSelectTool(tool.key)}
            tool={tool}
          />
        );
      })}
    </View>
  );
}

function ToolButton({ active, onPress, tool }) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(active ? 1 : 0, { duration: 180 }));
  }, [active, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.82 + progress.value * 0.18,
    transform: [{ scale: 1 + progress.value * 0.06 }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.toolButton,
        active ? styles.toolButtonActive : null,
        animatedStyle,
      ]}
    >
      <Ionicons
        name={tool.icon}
        size={19}
        color={active ? colors.onPrimary : colors.primary}
      />
      <Text style={[styles.toolLabel, active ? styles.toolLabelActive : null]}>
        {tool.label}
      </Text>
    </AnimatedPressable>
  );
}
