import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { formatTime, waveformBars } from "../../screens/create/createOptions";
import { getUserProfile } from "../../utils/profile";
import {
  likePost,
  savePost,
  subscribeLikeStatus,
  subscribePostSocial,
  subscribeSaveStatus,
  unlikePost,
  unsavePost,
} from "../../utils/socialPosts";
import { ActionButtons } from "./ActionButtons";
import { CommentSheet } from "./CommentSheet";

function makeHandle(value) {
  return String(value || "")
    .trim()
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "");
}

function isPlaceholderHandle(value) {
  return ["student_creator", "medianova_demo", "creator"].includes(
    makeHandle(value),
  );
}

export function VideoCard({
  feedHeight = 0,
  post,
  isActive = false,
  onProfilePress,
  onComment,
  onShare,
}) {
  const router = useRouter();
  const { user } = useAuth();
  const mediaUrl = post?.mediaURL || "";
  const type = post?.type || "video";
  const isAudioPost = type === "audio";
  const isPhotoPost = type === "photo";
  const cardHeight = Math.max(Number(feedHeight) || 0, 360);

  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [saveCount, setSaveCount] = useState(post?.saves || 0);
  const [commentCount, setCommentCount] = useState(
    post?.commentsCount ?? post?.comments ?? 0,
  );
  const [authorProfile, setAuthorProfile] = useState(null);

  const authorName =
    authorProfile?.username ||
    makeHandle(authorProfile?.displayName || authorProfile?.email) ||
    (!isPlaceholderHandle(post?.username) ? post?.username : "") ||
    makeHandle(post?.displayName || post?.userId) ||
    "creator";
  const authorPhoto =
    authorProfile?.photoURL ||
    post?.photoURL ||
    "https://i.pravatar.cc/150?img=1";

  useEffect(() => {
    let isMounted = true;

    async function loadAuthor() {
      setAuthorProfile(null);

      if (!post?.userId) {
        return;
      }

      const shouldResolve =
        !post?.username ||
        isPlaceholderHandle(post.username) ||
        !post?.photoURL ||
        !post?.displayName;

      if (!shouldResolve) return;

      const result = await getUserProfile(post.userId);

      if (isMounted && result.success) {
        setAuthorProfile(result.profile);
      }
    }

    loadAuthor();

    return () => {
      isMounted = false;
    };
  }, [post?.displayName, post?.photoURL, post?.userId, post?.username]);

  useEffect(() => {
    if (!post?.id) {
      return undefined;
    }

    return subscribePostSocial(post.id, (result) => {
      if (!result.success) return;

      setLikeCount(result.counts.likes);
      setCommentCount(result.counts.comments);
      setSaveCount(result.counts.saves);
    });
  }, [post?.id]);

  useEffect(() => {
    if (!post?.id || !user?.uid) {
      return undefined;
    }

    const stopLike = subscribeLikeStatus(post.id, user.uid, (result) => {
      if (result.success) setLiked(result.isLiked);
    });
    const stopSave = subscribeSaveStatus(post.id, user.uid, (result) => {
      if (result.success) setSaved(result.isSaved);
    });

    return () => {
      stopLike();
      stopSave();
    };
  }, [post?.id, user?.uid]);

  async function handleLike() {
    if (!user?.uid) {
      Alert.alert("Login dibutuhkan", "Masuk dulu sebelum like post.");
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((value) => Math.max(value + (nextLiked ? 1 : -1), 0));

    const result = nextLiked
      ? await likePost(post.id, user.uid)
      : await unlikePost(post.id, user.uid);

    if (!result.success) {
      setLiked(!nextLiked);
      setLikeCount((value) => Math.max(value + (nextLiked ? -1 : 1), 0));
      Alert.alert("Like gagal", result.error);
    }
  }

  async function handleSave() {
    if (!user?.uid) {
      Alert.alert("Login dibutuhkan", "Masuk dulu sebelum save post.");
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);
    setSaveCount((value) => Math.max(value + (nextSaved ? 1 : -1), 0));

    const result = nextSaved
      ? await savePost(post.id, user.uid)
      : await unsavePost(post.id, user.uid);

    if (!result.success) {
      setSaved(!nextSaved);
      setSaveCount((value) => Math.max(value + (nextSaved ? -1 : 1), 0));
      Alert.alert("Save gagal", result.error);
    }
  }

  function handleProfileNavigation() {
    onProfilePress?.(post);
    router.push({
      pathname: "/(tabs)/profile",
      params: { userId: post?.userId || "" },
    });
  }

  function handleDoubleTapLike() {
    if (!user?.uid) {
      Alert.alert("Login dibutuhkan", "Masuk dulu sebelum like post.");
      return;
    }

    if (!liked) {
      handleLike();
    }
  }

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(260)
    .onEnd(() => {
      runOnJS(handleDoubleTapLike)();
    });

  function renderMedia() {
    if (!mediaUrl) {
      return <MissingMedia type={type} />;
    }

    if (isAudioPost) {
      return (
        <AudioSurface
          isActive={isActive}
          title={post?.title || "Voice note"}
          uri={mediaUrl}
        />
      );
    }

    if (isPhotoPost) {
      return <Image source={{ uri: mediaUrl }} style={styles.mediaFill} />;
    }

    return <VideoSurface isActive={isActive} uri={mediaUrl} />;
  }

  return (
    <GestureDetector gesture={doubleTapGesture}>
      <View style={[styles.container, { height: cardHeight }]}>
        {renderMedia()}

        <View style={styles.overlay}>
          <Pressable style={styles.profileRow} onPress={handleProfileNavigation}>
            <View>
              <Image
                source={{
                  uri: authorPhoto,
                }}
                style={styles.avatar}
              />
              <View style={styles.followBadge}>
                <Ionicons name="add" size={12} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.username}>
              @{authorName}
            </Text>
          </Pressable>

          <Text numberOfLines={expanded ? undefined : 2} style={styles.caption}>
            {post?.caption || "Exploring the new library! #campuslife"}
          </Text>

          <Pressable onPress={() => setExpanded(!expanded)}>
            <Text style={styles.moreText}>{expanded ? "less" : "more"}</Text>
          </Pressable>
        </View>

        <ActionButtons
          comments={commentCount}
          liked={liked}
          likes={likeCount}
          onComment={() => {
            if (post?.allowComments === false) {
              Alert.alert("Komentar ditutup", "Creator menonaktifkan komentar.");
              return;
            }

            setShowComments(true);
            onComment?.(post);
          }}
          onLike={handleLike}
          onSave={handleSave}
          onShare={() => onShare?.(post)}
          saved={saved}
          saves={saveCount}
        />

        <CommentSheet
          comments={[]}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => {}}
          postId={post.id}
          visible={showComments}
        />
      </View>
    </GestureDetector>
  );
}

function MissingMedia({ type }) {
  return (
    <View style={styles.missingMedia}>
      <Ionicons name="cloud-offline-outline" size={38} color="#FFFFFF" />
      <Text style={styles.missingTitle}>Media belum tersedia</Text>
      <Text style={styles.missingText}>
        {type === "audio"
          ? "Audio belum punya URL yang bisa diputar."
          : "File media belum punya URL yang bisa ditampilkan."}
      </Text>
    </View>
  );
}

function VideoSurface({ isActive, uri }) {
  const wasActiveRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = false;
  });

  useEffect(() => {
    if (isActive && !isPaused) {
      player.play();
    } else {
      player.pause();

      if (wasActiveRef.current && !isActive) {
        try {
          player.replay();
          player.pause();
        } catch {}

        setIsPaused(false);
        setProgress(0);
      }
    }

    wasActiveRef.current = isActive;
  }, [isActive, isPaused, player]);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const current = player.currentTime || 0;
        const duration = player.duration || 0;

        setCurrentSeconds(current);
        setDurationSeconds(duration);
        setProgress(duration > 0 ? current / duration : 0);
      } catch {}
    }, 250);

    return () => clearInterval(interval);
  }, [player]);

  function togglePlayback() {
    if (isPaused) {
      player.play();
    } else {
      player.pause();
    }

    setIsPaused(!isPaused);
  }

  return (
    <Pressable style={styles.mediaWrapper} onPress={togglePlayback}>
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={styles.mediaFill}
      />
      {isPaused ? (
        <View style={styles.pauseOverlay}>
          <Ionicons name="pause" size={60} color="#FFFFFF" />
        </View>
      ) : null}
      <Timeline
        currentSeconds={currentSeconds}
        durationSeconds={durationSeconds}
        progress={progress}
      />
    </Pressable>
  );
}

function AudioSurface({ isActive, title, uri }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const currentSeconds = status?.currentTime || 0;
  const durationSeconds =
    status?.duration || status?.durationMillis / 1000 || 0;
  const progress = durationSeconds > 0 ? currentSeconds / durationSeconds : 0;

  useEffect(() => {
    if (!isActive) {
      player.pause();
    }
  }, [isActive, player]);

  function togglePlayback() {
    if (status?.playing) {
      player.pause();
    } else {
      player.play();
    }
  }

  return (
    <Pressable style={styles.mediaWrapper} onPress={togglePlayback}>
      <View style={styles.audioSurface}>
        <View style={styles.audioDisc}>
          <Ionicons name="mic" size={34} color="#FFFFFF" />
        </View>
        <Text style={styles.audioTitle}>{title}</Text>
        <View style={styles.audioWave}>
          {waveformBars.map((heightValue, index) => (
            <View
              key={`${heightValue}-${index}`}
              style={[
                styles.audioBar,
                {
                  height: Math.max(12, heightValue + 8),
                  opacity: progress * waveformBars.length >= index ? 1 : 0.38,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.audioPlayBadge}>
          <Ionicons
            name={status?.playing ? "pause" : "play"}
            size={28}
            color="#FFFFFF"
          />
        </View>
      </View>
      <Timeline
        currentSeconds={currentSeconds}
        durationSeconds={durationSeconds}
        progress={progress}
      />
    </Pressable>
  );
}

function Timeline({ currentSeconds, durationSeconds, progress }) {
  return (
    <View style={styles.timelineWrapper}>
      <Text style={styles.timeText}>{formatTime(currentSeconds)}</Text>
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.timeText}>{formatTime(durationSeconds)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#000" },
  mediaWrapper: { flex: 1 },
  mediaFill: { position: "absolute", width: "100%", height: "100%" },
  missingMedia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#111820",
  },
  missingTitle: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  missingText: {
    marginTop: 8,
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  audioSurface: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#121820",
  },
  audioDisc: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: colors.primary,
  },
  audioTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 22,
    textAlign: "center",
  },
  audioWave: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  audioBar: {
    width: 7,
    borderRadius: 4,
    marginHorizontal: 3,
    backgroundColor: colors.secondary,
  },
  audioPlayBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  pauseOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -40,
    marginTop: -40,
  },
  overlay: { position: "absolute", left: 16, bottom: 120, width: "72%" },
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  followBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 10,
  },
  caption: { color: "#FFFFFF", fontSize: 13, lineHeight: 20 },
  moreText: { color: "#FFFFFF", fontWeight: "700", marginTop: 6 },
  timelineWrapper: {
    position: "absolute",
    left: 16,
    right: 25,
    bottom: 92,
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: { color: "#FFFFFF", fontSize: 10, minWidth: 42 },
  progressContainer: {
    flex: 1,
    height: 3,
    marginHorizontal: 8,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
