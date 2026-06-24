import Slider from "@react-native-community/slider";
import { View } from "react-native";

import { colors } from "../../constants/theme";
import { editorStyles as styles } from "./editorStyles";

const saturationColors = [
  "#6B7280",
  "#94A3B8",
  "#C8D9E6",
  "#567C8D",
  "#2F4156",
  "#C81E1E",
  "#F59E0B",
  "#22C55E",
];

export function SaturationSlider({ onChange, value }) {
  return (
    <View style={styles.saturationSliderWrap}>
      <View pointerEvents="none" style={styles.saturationRail}>
        {saturationColors.map((color) => (
          <View
            key={color}
            style={[styles.saturationBlock, { backgroundColor: color }]}
          />
        ))}
      </View>
      <Slider
        minimumValue={-1}
        maximumValue={1}
        step={0.05}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="transparent"
        maximumTrackTintColor="transparent"
        thumbTintColor={colors.primary}
      />
    </View>
  );
}
