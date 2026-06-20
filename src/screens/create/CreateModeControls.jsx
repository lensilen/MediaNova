import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import {
  filters,
  mediaModes,
  noSticker,
  stickerOptions,
} from "./createOptions";
import { createStyles as styles } from "./createStyles";

export function CreateModeControls({
  activeRecording,
  mode,
  onCapture,
  onFilterSelect,
  onLibraryPress,
  onModeChange,
  onPauseVideo,
  onResetFilter,
  onStickerSelect,
  pendingMedia,
  selectedFilter,
  selectedSticker,
  showFilters,
  videoPaused,
}) {
  const isVideoRecording = mode === "video" && activeRecording;

  return (
    <View style={styles.bottomOverlay}>
      {showFilters ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRail}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter.key}
              onPress={() => onFilterSelect(filter)}
              style={[
                styles.filterChip,
                selectedFilter.key === filter.key ? styles.filterChipActive : null,
              ]}
            >
              <View
                style={[
                  styles.filterSwatch,
                  { backgroundColor: filter.tint || colors.tertiary },
                ]}
              />
              <Text
                style={[
                  styles.filterLabel,
                  selectedFilter.key === filter.key ? styles.filterLabelActive : null,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
          {[noSticker, ...stickerOptions].map((sticker) => (
            <Pressable
              key={sticker.key}
              onPress={() => onStickerSelect(sticker)}
              style={[
                styles.stickerChip,
                selectedSticker.key === sticker.key
                  ? styles.filterChipActive
                  : null,
              ]}
            >
              {sticker.source ? (
                <Image
                  resizeMode="contain"
                  source={sticker.source}
                  style={styles.stickerPreview}
                />
              ) : (
                <Ionicons name="close" size={22} color={colors.primary} />
              )}
              <Text
                style={[
                  styles.filterLabel,
                  selectedSticker.key === sticker.key
                    ? styles.filterLabelActive
                    : null,
                ]}
              >
                {sticker.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.modeSwitch}>
        {mediaModes.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => onModeChange(item.key)}
            style={[
              styles.modeItem,
              mode === item.key ? styles.modeItemActive : null,
            ]}
          >
            <Text
              style={[
                styles.modeText,
                mode === item.key ? styles.modeTextActive : null,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.captureRow}>
        <Pressable style={styles.miniThumb} onPress={onLibraryPress}>
          {pendingMedia?.uri && pendingMedia.type !== "audio" ? (
            <Image source={{ uri: pendingMedia.uri }} style={styles.thumbImage} />
          ) : (
            <Ionicons name="images-outline" size={22} color={colors.primary} />
          )}
        </Pressable>
        <Pressable
          style={[styles.captureButton, isVideoRecording ? styles.stopButton : null]}
          onPress={onCapture}
        >
          <View
            style={[
              styles.captureInner,
              isVideoRecording ? styles.stopInner : null,
            ]}
          />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={isVideoRecording ? onPauseVideo : onResetFilter}
        >
          <Ionicons
            name={isVideoRecording && !videoPaused ? "pause" : isVideoRecording ? "play" : "refresh"}
            size={20}
            color={colors.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}
