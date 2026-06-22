import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/theme";
import { StickerOverlay } from "../../components/editor/StickerOverlay";
import { useAuth } from "../../hooks/useAuth";
import { useUpload } from "../../hooks/useUpload";
import { useCreateDraftStore } from "../../store/createDraftStore";
import { sendLocalNotification } from "../../utils/notifications";
import { createPost } from "../../utils/posts";
import { getStickerByKey, waveformBars } from "./createOptions";
import { previewStyles as styles } from "./previewStyles";

function readParam(value, fallback = "") {
  if (Array.isArray(value)) return value[0] || fallback;
  return typeof value === "string" ? value : fallback;
}

export function PreviewScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { error, isUploading, progress, uploadAudio, uploadImage, uploadVideo } =
    useUpload();
  const draftId = readParam(params.draftId);
  const storedDraft = useCreateDraftStore((state) =>
    state.drafts[draftId] || state.drafts[state.currentDraftId],
  );
  const clearDraft = useCreateDraftStore((state) => state.clearDraft);
  const uri = storedDraft?.uri || readParam(params.uri);
  const mediaType =
    storedDraft?.type || readParam(params.mediaType, "video");
  const selectedSticker = getStickerByKey(
    storedDraft?.sticker || readParam(params.sticker, "none"),
  );
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState("Everyone");
  const [allowComments, setAllowComments] = useState(true);

  const videoSource = useMemo(
    () => (mediaType === "video" && uri ? { uri } : null),
    [mediaType, uri],
  );
  const player = useVideoPlayer(videoSource, (nextPlayer) => {
    nextPlayer.loop = true;
  });

  function buildEditMeta() {
    return {
      ...(storedDraft?.editMeta || {}),
      brightness: storedDraft?.editMeta?.brightness || readParam(params.brightness),
      contrast: storedDraft?.editMeta?.contrast || readParam(params.contrast),
      filter:
        storedDraft?.editMeta?.filter ||
        storedDraft?.filter ||
        readParam(params.filter, "none"),
      overlayText:
        storedDraft?.editMeta?.overlayText || readParam(params.overlayText),
      saturation:
        storedDraft?.editMeta?.saturation || readParam(params.saturation),
      speed: storedDraft?.editMeta?.speed || readParam(params.speed, "1"),
      sticker: selectedSticker.key,
      trimEnd: storedDraft?.editMeta?.trimEnd || readParam(params.trimEnd),
      trimStart:
        storedDraft?.editMeta?.trimStart || readParam(params.trimStart),
      volume: storedDraft?.editMeta?.volume || readParam(params.volume, "1"),
    };
  }

  async function uploadByType() {
    const metadata = { mediaType, userId: user.uid, ...buildEditMeta() };

    if (mediaType === "photo") {
      return uploadImage(uri, null, { metadata });
    }

    if (mediaType === "audio") {
      return uploadAudio(uri, null, { metadata });
    }

    return uploadVideo(uri, null, { metadata });
  }

  async function publishPost() {
    if (!user?.uid) {
      Alert.alert("Login dibutuhkan", "Masuk dulu sebelum upload post.");
      return;
    }

    if (!uri) {
      Alert.alert("Media belum ada", "Kembali ke create untuk memilih media.");
      return;
    }

    const uploadResult = await uploadByType();

    if (!uploadResult.success) return;

    const postResult = await createPost(
      user.uid,
      mediaType,
      uploadResult.downloadURL,
      uploadResult.thumbnailURL || "",
      caption,
      {
        allowComments,
        editMeta: buildEditMeta(),
        location,
        title,
        visibility: visibility.toLowerCase(),
      },
    );

    if (!postResult.success) {
      Alert.alert("Post gagal", postResult.error);
      return;
    }

    await sendLocalNotification("Post terkirim", "Feed baru berhasil ditambahkan.", {
      postId: postResult.post.id,
      type: mediaType,
    });

    clearDraft(storedDraft?.id || draftId);
    router.replace("/(tabs)");
  }

  function saveDraft() {
    Alert.alert("Draft tersimpan", "Draft lokal siap dilanjutkan lagi nanti.");
  }

  function renderMedia() {
    if (mediaType === "audio") {
      return (
        <View style={styles.audioPreviewCard}>
          <View style={styles.audioPreviewIcon}>
            <Ionicons name="mic" size={18} color={colors.onPrimary} />
          </View>
          <View style={styles.audioPreviewWave}>
            {waveformBars.slice(0, 14).map((height, index) => (
              <View
                key={`${height}-${index}`}
                style={[
                  styles.audioPreviewBar,
                  {
                    height: Math.max(12, height + 4),
                    backgroundColor:
                      index % 2 ? colors.secondary : colors.primary,
                  },
                ]}
              />
            ))}
          </View>
          <Text numberOfLines={1} style={styles.audioPreviewText}>
            Voice note
          </Text>
        </View>
      );
    }

    if (mediaType === "video" && uri) {
      return (
        <View style={styles.mediaThumb}>
          <VideoView contentFit="cover" player={player} style={styles.mediaImage} />
          <StickerOverlay compact sticker={selectedSticker} />
        </View>
      );
    }

    return (
      <View style={styles.mediaThumb}>
        {uri ? (
          <>
            <Image source={{ uri }} style={styles.mediaImage} />
            <StickerOverlay compact sticker={selectedSticker} />
          </>
        ) : (
          <Ionicons name="image-outline" size={26} color={colors.primary} />
        )}
      </View>
    );
  }

  function cycleVisibility() {
    setVisibility((value) => (value === "Everyone" ? "Followers" : "Everyone"));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>New Post</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.composeRow}>
            {renderMedia()}
            <View style={styles.inputGroup}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Add a title..."
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <TextInput
                multiline
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a caption... Use #hashtags or @mentions"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.captionInput]}
              />
            </View>
          </View>

          <View style={styles.section}>
            <PostRow
              icon="location-outline"
              title="Add location"
              value={location || "Set location"}
              onPress={() => setLocation(location ? "" : "Jakarta")}
            />
            <PostRow
              icon="earth-outline"
              title="Who can view this post"
              value={visibility}
              onPress={cycleVisibility}
            />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="chatbox-outline" size={19} color={colors.primary} />
                <Text style={styles.rowText}>Allow comments</Text>
              </View>
              <Switch
                value={allowComments}
                onValueChange={setAllowComments}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={colors.onPrimary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.rowSubText}>Share to</Text>
            <View style={styles.shareRow}>
              {["link-outline", "logo-twitter", "logo-instagram"].map((icon) => (
                <Pressable key={icon} style={styles.shareButton}>
                  <Ionicons name={icon} size={18} color={colors.primary} />
                </Pressable>
              ))}
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(progress.percent || 0, 4)}%` },
                ]}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.secondaryButton} onPress={saveDraft}>
            <Text style={styles.secondaryText}>Drafts</Text>
          </Pressable>
          <Pressable
            disabled={isUploading}
            style={styles.primaryButton}
            onPress={publishPost}
          >
            <Ionicons name="send" size={16} color={colors.onPrimary} />
            <Text style={styles.primaryText}>
              {isUploading ? `${progress.percent || 0}%` : "Post"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function PostRow({ icon, onPress, title, value }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={19} color={colors.primary} />
        <View>
          <Text style={styles.rowText}>{title}</Text>
          <Text style={styles.rowSubText}>{value}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}
