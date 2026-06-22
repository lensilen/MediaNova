import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { filters, mediaModes, noSticker, stickerOptions } from "./createOptions";
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
  selectedSticker = noSticker,
  showColorFilters,
  showStickerFilters,
  videoPaused,
}) {
  const isVideoRecording = mode === "video" && activeRecording;
  const isAudioRecording = mode === "audio" && activeRecording;
  const isMediaRecording = isVideoRecording || isAudioRecording;

  return (
    <View style={styles.bottomOverlay}>
      {showColorFilters ? (
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
        </ScrollView>
      ) : null}

      {showStickerFilters ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRail}
        >
          {stickerOptions.map((sticker) => (
            <Pressable
              key={sticker.key}
              onPress={() => onStickerSelect(sticker)}
              style={[
                styles.filterChip,
                selectedSticker.key === sticker.key ? styles.filterChipActive : null,
              ]}
            >
              <Image
                resizeMode="contain"
                source={sticker.source}
                style={styles.stickerPreview}
              />
              <Text
                style={[
                  styles.filterLabel,
                  selectedSticker.key === sticker.key ? styles.filterLabelActive : null,
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
          style={[styles.captureButton, isMediaRecording ? styles.stopButton : null]}
          onPress={onCapture}
        >
          <View
            style={[
              styles.captureInner,
              isMediaRecording ? styles.stopInner : null,
            ]}
          />
        </Pressable>
        <Pressable
          disabled={isAudioRecording}
          style={[styles.iconButton, isAudioRecording ? styles.iconButtonActive : null]}
          onPress={isVideoRecording ? onPauseVideo : onResetFilter}
        >
          <Ionicons
            name={
              isAudioRecording
                ? "mic"
                : isVideoRecording && !videoPaused
                  ? "pause"
                  : isVideoRecording
                    ? "play"
                    : "refresh"
            }
            size={20}
            color={isAudioRecording ? colors.onPrimary : colors.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}
