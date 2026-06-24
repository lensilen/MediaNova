import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { editorStyles as styles } from "./editorStyles";

export function EditorHeader({ onBack, onNext, title }) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.iconButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color={colors.text} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <Pressable style={styles.nextButton} onPress={onNext}>
        <Text style={styles.nextText}>Next</Text>
      </Pressable>
    </View>
  );
}
