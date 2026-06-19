import { StyleSheet } from "react-native";

import { colors } from "../../constants/theme";

export const previewStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 18,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  content: {
    flex: 1,
    padding: 18,
  },
  composeRow: {
    flexDirection: "row",
    gap: 14,
  },
  mediaThumb: {
    width: 86,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.surfaceSoft,
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  inputGroup: {
    flex: 1,
    gap: 10,
  },
  input: {
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 8,
  },
  captionInput: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 18,
    paddingTop: 12,
  },
  row: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  rowSubText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  shareRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  shareButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.surface,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceSoft,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 18,
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  secondaryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  primaryText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "900",
  },
});
