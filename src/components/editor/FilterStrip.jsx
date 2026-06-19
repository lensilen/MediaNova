import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import {
  filters as defaultFilters,
  noFilter,
} from "../../screens/create/createOptions";

export function FilterStrip({
  filters = defaultFilters,
  onSelect,
  selectedKey = noFilter.key,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {filters.map((filter) => (
        <Pressable
          key={filter.key}
          onPress={() =>
            onSelect?.(selectedKey === filter.key ? noFilter : filter)
          }
          style={[
            styles.item,
            selectedKey === filter.key ? styles.itemActive : null,
          ]}
        >
          <View style={[styles.swatch, { backgroundColor: filter.tint }]} />
          <Text style={styles.label}>{filter.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingVertical: 6,
  },
  item: {
    width: 70,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 8,
  },
  itemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.tertiary,
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  label: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "800",
  },
});
