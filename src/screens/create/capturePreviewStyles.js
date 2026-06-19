import { StyleSheet } from "react-native";

import { colors } from "../../constants/theme";

export const capturePreviewStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 18,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 16,
  },
  previewBox: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.surfaceSoft,
  },
  media: {
    width: "100%",
    height: "100%",
  },
  audioBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
  },
  audioButton: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 35,
    backgroundColor: colors.primary,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  waveBar: {
    width: 5,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
  },
  backButton: {
    flex: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  nextButton: {
    flex: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  backText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  nextText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
});
