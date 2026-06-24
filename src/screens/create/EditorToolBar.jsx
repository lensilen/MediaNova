import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { editorStyles as styles } from "./editorStyles";

export function EditorToolBar({ activeTool, onSelectTool, tools }) {
  return (
    <View style={styles.toolRow}>
      {tools.map((tool) => {
        const active = activeTool === tool.key;

        return (
          <Pressable
            key={tool.key}
            onPress={() => onSelectTool(tool.key)}
            style={[styles.toolButton, active ? styles.toolButtonActive : null]}
          >
            <Ionicons
              name={tool.icon}
              size={19}
              color={active ? colors.onPrimary : colors.primary}
            />
            <Text style={[styles.toolLabel, active ? styles.toolLabelActive : null]}>
              {tool.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
