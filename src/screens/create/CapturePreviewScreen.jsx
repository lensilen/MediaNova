import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { Image, Pressable, SafeAreaView, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { useCreateDraftStore } from "../../store/createDraftStore";
import { waveformBars } from "./createOptions";
import { capturePreviewStyles as styles } from "./capturePreviewStyles";

function readParam(value, fallback = "") {
  if (Array.isArray(value)) return value[0] || fallback;
  return typeof value === "string" ? value : fallback;
}

export function CapturePreviewScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const draftId = readParam(params.draftId);
  const storedDraft = useCreateDraftStore((state) =>
    state.drafts[draftId] || state.drafts[state.currentDraftId],
  );
  const updateDraft = useCreateDraftStore((state) => state.updateDraft);
  const uri = storedDraft?.uri || readParam(params.uri);
  const mediaType =
    storedDraft?.type || readParam(params.mediaType, "video");
  const filter = storedDraft?.filter || readParam(params.filter, "none");
  const sticker = storedDraft?.sticker || readParam(params.sticker, "none");
  const videoSource = useMemo(
    () => (mediaType === "video" && uri ? { uri } : null),
    [mediaType, uri],
  );
  const audioSource = useMemo(
    () => (mediaType === "audio" && uri ? uri : null),
    [mediaType, uri],
  );
  const videoPlayer = useVideoPlayer(videoSource, (player) => { player.loop = true; player.play(); });
  const audioPlayer = useAudioPlayer(audioSource);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    let isActive = true;

    if (mediaType !== "video" || !uri || storedDraft?.thumbnailUri) {
      return undefined;
    }

    VideoThumbnails.getThumbnailAsync(uri, { time: 350 })
      .then((result) => {
        if (isActive) {
          updateDraft(storedDraft?.id || draftId, { thumbnailUri: result.uri });
        }
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, [draftId, mediaType, storedDraft?.id, storedDraft?.thumbnailUri, updateDraft, uri]);

  function goNext() {
    const routes = {
      audio: "/audio-editor",
      photo: "/photo-editor",
      video: "/video-editor",
    };

    router.push({
      pathname: routes[mediaType] || "/video-editor",
      params: {
        draftId: storedDraft?.id || draftId,
        filter,
        mediaType,
        sticker,
        uri,
      },
    });
  }

  function toggleAudio() {
    if (audioStatus.playing) audioPlayer.pause();
    else audioPlayer.play();
  }

  function renderPreview() {
    if (mediaType === "photo") {
      return uri ? (
        <Image source={{ uri }} resizeMode="cover" style={styles.media} />
      ) : (
        <EmptyPreview icon="image-outline" text="Foto belum kebaca." />
      );
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

    return uri ? (
      <VideoView
        contentFit="cover"
        nativeControls
        player={videoPlayer}
        style={styles.media}
      />
    ) : (
      <EmptyPreview icon="videocam-outline" text="Video belum kebaca." />
    );
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

function EmptyPreview({ icon, text }) {
  return (
    <View style={styles.audioBox}>
      <Ionicons name={icon} size={32} color={colors.primary} />
      <Text style={styles.backText}>{text}</Text>
    </View>
  );
}
