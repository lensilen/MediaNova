import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/theme";
import { formatTime, waveformBars } from "../create/createOptions";

function readParam(value, fallback = "") {
  if (Array.isArray(value)) return value[0] || fallback;
  return typeof value === "string" ? value : fallback;
}

export function MediaViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const type = readParam(params.type, "video");
  const uri = readParam(params.uri);
  const title = readParam(params.title, "MediaNova");
  const caption = readParam(params.caption);

  function renderMedia() {
    if (!uri) {
      return (
        <View style={styles.emptyBox}>
          <Ionicons name="alert-circle-outline" size={34} color={colors.primary} />
          <Text style={styles.emptyText}>Media belum punya URL.</Text>
        </View>
      );
    }

    if (type === "audio") {
      return <AudioViewer title={title} uri={uri} />;
    }

    if (type === "photo") {
      return <Image source={{ uri }} resizeMode="contain" style={styles.media} />;
    }

    return <VideoViewer uri={uri} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.mediaBox}>{renderMedia()}</View>

      {caption ? (
        <View style={styles.captionBox}>
          <Text style={styles.caption}>{caption}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function VideoViewer({ uri }) {
  const player = useVideoPlayer(uri, (nextPlayer) => {
    nextPlayer.loop = true;
    nextPlayer.play();
  });

  return (
    <VideoView
      contentFit="contain"
      nativeControls
      player={player}
      style={styles.media}
    />
  );
}

function AudioViewer({ title, uri }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const currentSeconds = status?.currentTime || 0;
  const durationSeconds = status?.duration || status?.durationMillis / 1000 || 0;

  function toggleAudio() {
    if (status?.playing) {
      player.pause();
      return;
    }

    player.play();
  }

  return (
    <View style={styles.audioBox}>
      <Pressable style={styles.audioButton} onPress={toggleAudio}>
        <Ionicons
          name={status?.playing ? "pause" : "play"}
          size={36}
          color={colors.onPrimary}
        />
      </Pressable>
      <Text numberOfLines={2} style={styles.audioTitle}>{title}</Text>
      <View style={styles.waveRow}>
        {waveformBars.map((height, index) => (
          <View
            key={`${height}-${index}`}
            style={[
              styles.waveBar,
              {
                height: height + 18,
                opacity:
                  durationSeconds > 0 &&
                  currentSeconds / durationSeconds * waveformBars.length >= index
                    ? 1
                    : 0.35,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.audioTime}>
        {formatTime(currentSeconds)} / {formatTime(durationSeconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  mediaBox: {
    flex: 1,
    backgroundColor: "#000000",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.surface,
  },
  emptyText: {
    color: colors.text,
    fontWeight: "800",
  },
  captionBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    backgroundColor: colors.surface,
  },
  caption: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  audioBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#121820",
  },
  audioButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primary,
  },
  audioTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 22,
    marginBottom: 18,
    textAlign: "center",
  },
  waveRow: {
    minHeight: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  waveBar: {
    width: 7,
    borderRadius: 4,
    marginHorizontal: 3,
    backgroundColor: colors.secondary,
  },
  audioTime: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 18,
  },
});
