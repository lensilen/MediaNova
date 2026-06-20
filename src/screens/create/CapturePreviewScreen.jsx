import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, SafeAreaView, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { waveformBars } from "./createOptions";
import { capturePreviewStyles as styles } from "./capturePreviewStyles";

function readParam(value, fallback = "") {
  if (Array.isArray(value)) return value[0] || fallback;
  return typeof value === "string" ? value : fallback;
}

function getEditorRoute(mediaType) {
  if (mediaType === "photo") return "/photo-editor";
  if (mediaType === "audio") return "/audio-editor";
  return "/video-editor";
}

export function CapturePreviewScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const uri = readParam(params.uri);
  const mediaType = readParam(params.mediaType, "video");
  const filter = readParam(params.filter, "none");
  const videoSource = useMemo(() => mediaType === "video" && uri ? { uri } : null, [mediaType, uri]);
  const audioSource = useMemo(() => mediaType === "audio" && uri ? { uri } : null, [mediaType, uri]);
  const videoPlayer = useVideoPlayer(videoSource, (player) => { player.loop = true; player.play(); });
  const audioPlayer = useAudioPlayer(audioSource);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  function goNext() {
    router.push({
      pathname: getEditorRoute(mediaType),
      params: { filter, mediaType, uri },
    });
  }

  function toggleAudio() {
    if (audioStatus.playing) audioPlayer.pause();
    else audioPlayer.play();
  }

  function renderPreview() {
    if (mediaType === "photo") {
      return <Image source={{ uri }} resizeMode="cover" style={styles.media} />;
    }

    if (mediaType === "audio") {
      return (
        <View style={styles.audioBox}>
          <Pressable style={styles.audioButton} onPress={toggleAudio}>
            <Ionicons name={audioStatus.playing ? "pause" : "play"} size={28} color={colors.onPrimary} />
          </Pressable>
          <View style={styles.waveRow}>
            {waveformBars.map((height, index) => (
              <View key={`${height}-${index}`} style={[styles.waveBar, { height: height + 18 }]} />
            ))}
          </View>
        </View>
      );
    }

    return <VideoView contentFit="cover" nativeControls player={videoPlayer} style={styles.media} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Text style={styles.title}>Preview</Text>
        <View style={styles.previewBox}>{renderPreview()}</View>
        <View style={styles.actions}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable style={styles.nextButton} onPress={goNext}>
            <Text style={styles.nextText}>Next</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
