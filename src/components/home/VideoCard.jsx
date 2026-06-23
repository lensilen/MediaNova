import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import { useRouter } from "expo-router"; // 1. Gunakan useRouter dari expo-router

import { ActionButtons } from "./ActionButtons";
import { CommentSheet } from "./CommentSheet";
import { useAuth } from "../../hooks/useAuth";
import {
  formatTime,
  waveformBars,
} from "../../screens/create/createOptions";
import {
  isLiked,
  isSaved,
  likePost,
  savePost,
  unlikePost,
  unsavePost,
} from "../../utils/socialPosts";
import { colors } from "../../constants/theme";

const { height } = Dimensions.get("window");

export function VideoCard({
  post,
  isActive = false,
  onProfilePress,
  onComment,
  onShare,
}) {
  const router = useRouter(); // 2. Inisialisasi router
  const wasActiveRef = useRef(false);
  const { user } = useAuth();
  const mediaUrl = post?.mediaURL || "https://www.w3schools.com/html/mov_bbb.mp4";
  const isAudioPost = post?.type === "audio";
  const isPhotoPost = post?.type === "photo";
  const isVideoPost = !isAudioPost && !isPhotoPost;

  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [saveCount, setSaveCount] = useState(post?.saves || 0);
  const [commentCount, setCommentCount] = useState(
    post?.commentsCount ?? post?.comments ?? 0
  );
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const player = useVideoPlayer(
    isVideoPost ? mediaUrl : null,
    (videoPlayer) => {
      videoPlayer.loop = true;
      videoPlayer.muted = false;
    }
  );
  const audioPlayer = useAudioPlayer(isAudioPost ? mediaUrl : null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    let isActiveCard = true;

    async function loadSocialState() {
      if (!post?.id || post?.isDemo || !user?.uid) {
        setLiked(false);
        setSaved(false);
        return;
      }

      const [likedResult, savedResult] = await Promise.all([
        isLiked(post.id, user.uid),
        isSaved(post.id, user.uid),
      ]);

      if (!isActiveCard) return;

      if (likedResult.success) setLiked(likedResult.isLiked);
      if (savedResult.success) setSaved(savedResult.isSaved);
    }

    loadSocialState();

    return () => {
      isActiveCard = false;
    };
  }, [post?.id, post?.isDemo, user?.uid]);

  useEffect(() => {
    if (!isVideoPost || !player) return;

    if (isActive && !isPaused) {
      player.play();
    } else {
      player.pause();

      if (wasActiveRef.current && !isActive) {
        try {
          player.replay();
          player.pause();
        } catch (_error) {}

        setIsPaused(false);
        setProgress(0);
      }
    }

    wasActiveRef.current = isActive;
  }, [isActive, isPaused, isVideoPost, player]);

  useEffect(() => {
    if (!isVideoPost || !player) return;

    const interval = setInterval(() => {
      try {
        const current = player.currentTime || 0;
        const duration = player.duration || 1;

        setProgress(current / duration);
      } catch (_error) {}
    }, 250);

    return () => clearInterval(interval);
  }, [isVideoPost, player]);

  useEffect(() => {
    if (!isAudioPost) return;

    const timer = setInterval(() => {
      const current = audioStatus?.currentTime || 0;
      const duration = audioStatus?.duration || audioStatus?.durationMillis / 1000 || 1;

      setProgress(duration > 0 ? current / duration : 0);
      setIsPaused(!audioStatus?.playing);
    }, 250);

    return () => clearInterval(timer);
  }, [
    audioStatus?.currentTime,
    audioStatus?.duration,
    audioStatus?.durationMillis,
    audioStatus?.playing,
    isAudioPost,
  ]);

  useEffect(() => {
    if (isAudioPost && !isActive) {
      audioPlayer.pause();
    }
  }, [audioPlayer, isActive, isAudioPost]);

  const handleMediaPress = () => {
    if (isAudioPost) {
      if (audioStatus?.playing) {
        audioPlayer.pause();
      } else {
        audioPlayer.play();
      }

      return;
    }

    if (!isVideoPost || !player) return;

    if (isPaused) {
      player.play();
    } else {
      player.pause();
    }

    setIsPaused(!isPaused);
  };

  async function handleLike() {
    if (post?.isDemo) {
      const nextLiked = !liked;
      setLiked(nextLiked);
      setLikeCount((value) => Math.max(value + (nextLiked ? 1 : -1), 0));
      return;
    }

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
    if (post?.isDemo) {
      const nextSaved = !saved;
      setSaved(nextSaved);
      setSaveCount((value) => Math.max(value + (nextSaved ? 1 : -1), 0));
      return;
    }

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

  // 3. Fungsi Navigasi yang disesuaikan untuk Expo Router
  // Cari fungsi ini di dalam VideoCard.jsx milikmu
  const handleProfileNavigation = () => {
    onProfilePress?.(post);
    router.push({
      pathname: "/profile",
      params: { username: post?.username || "student_creator" },
    });
  };

  const currentSeconds = isAudioPost
    ? audioStatus?.currentTime || 0
    : player?.currentTime || 0;
  const durationSeconds = isAudioPost
    ? audioStatus?.duration || audioStatus?.durationMillis / 1000 || 0
    : player?.duration || 0;

  return (
    <View style={styles.container}>
      <Pressable style={styles.videoWrapper} onPress={handleMediaPress}>
        {isVideoPost ? (
          <>
            <VideoView
              player={player}
              style={styles.video}
              nativeControls={false}
              contentFit="cover"
            />

            {isPaused && (
              <View style={styles.pauseOverlay}>
                <Ionicons name="pause" size={60} color="#FFFFFF" />
              </View>
            )}
          </>
        ) : null}

        {isAudioPost ? (
          <View style={styles.audioSurface}>
            <View style={styles.audioDisc}>
              <Ionicons name="mic" size={34} color="#FFFFFF" />
            </View>
            <Text style={styles.audioTitle}>{post?.title || "Voice note"}</Text>
            <View style={styles.audioWave}>
              {waveformBars.map((height, index) => (
                <View
                  key={`${height}-${index}`}
                  style={[
                    styles.audioBar,
                    {
                      height: Math.max(12, height + 8),
                      opacity: progress * waveformBars.length >= index ? 1 : 0.38,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.audioPlayBadge}>
              <Ionicons
                name={audioStatus?.playing ? "pause" : "play"}
                size={28}
                color="#FFFFFF"
              />
            </View>
          </View>
        ) : null}

        {isPhotoPost ? (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.video}
            resizeMode="cover"
          />
        ) : null}
      </Pressable>

      <View style={styles.overlay}>
        <Pressable
          style={styles.profileRow}
          onPress={handleProfileNavigation}
        >
          <View>
            <Image
              source={{
                uri: post?.photoURL || "https://i.pravatar.cc/150?img=1",
              }}
              style={styles.avatar}
            />

            <View style={styles.followBadge}>
              <Ionicons name="add" size={12} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.username}>
            @{post?.username || "student_creator"}
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
        likes={likeCount}
        comments={commentCount}
        saves={saveCount}
        liked={liked}
        saved={saved}
        onLike={handleLike}
        onComment={() => {
          setShowComments(true);
          onComment?.(post);
        }}
        onSave={handleSave}
        onShare={() => onShare?.(post)}
      />

      <View style={styles.timelineWrapper}>
        <Text style={styles.timeText}>
          {formatTime(currentSeconds)}
        </Text>

        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.timeText}>
          {formatTime(durationSeconds)}
        </Text>
      </View>

      <CommentSheet
        visible={showComments}
        onClose={() => setShowComments(false)}
        comments={[]}
        postId={post.id}
        onCommentAdded={() => setCommentCount((prev) => prev + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: height, backgroundColor: "#000" },
  videoWrapper: { flex: 1 },
  video: { position: "absolute", width: "100%", height: "100%" },
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
  username: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", marginLeft: 10 },
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
  timeText: { color: "#FFFFFF", fontSize: 10, minWidth: 30 },
  progressContainer: {
    flex: 1,
    height: 3,
    marginHorizontal: 8,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressFill: { height: "100%", borderRadius: 2, backgroundColor: colors?.primary || "#FFF" },
});
