import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { formatTime, waveformBars } from "../../screens/create/createOptions";
import {
  isLiked,
  isSaved,
  likePost,
  savePost,
  unlikePost,
  unsavePost,
} from "../../utils/socialPosts";
import { ActionButtons } from "./ActionButtons";
import { CommentSheet } from "./CommentSheet";

const { height } = Dimensions.get("window");
const demoVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";

export function VideoCard({
  post,
  isActive = false,
  onProfilePress,
  onComment,
  onShare,
}) {
  const router = useRouter();
  const { user } = useAuth();
  const mediaUrl = post?.mediaURL || demoVideoUrl;
  const type = post?.type || "video";
  const isAudioPost = type === "audio";
  const isPhotoPost = type === "photo";

  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [saveCount, setSaveCount] = useState(post?.saves || 0);
  const [commentCount, setCommentCount] = useState(
    post?.commentsCount ?? post?.comments ?? 0,
  );

  useEffect(() => {
    let isMounted = true;

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

      if (!isMounted) return;

      if (likedResult.success) setLiked(likedResult.isLiked);
      if (savedResult.success) setSaved(savedResult.isSaved);
    }

    loadSocialState();

    return () => {
      isMounted = false;
    };
  }, [post?.id, post?.isDemo, user?.uid]);

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

  function handleProfileNavigation() {
    onProfilePress?.(post);
    router.push({
      pathname: "/profile",
      params: { username: post?.username || "student_creator" },
    });
  }

  function renderMedia() {
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
    <View style={styles.container}>
      {renderMedia()}

      <View style={styles.overlay}>
        <Pressable style={styles.profileRow} onPress={handleProfileNavigation}>
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
        comments={commentCount}
        liked={liked}
        likes={likeCount}
        onComment={() => {
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
        onCommentAdded={() => setCommentCount((prev) => prev + 1)}
        postId={post.id}
        visible={showComments}
      />
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
  const durationSeconds = status?.duration || status?.durationMillis / 1000 || 0;
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
  container: { height, backgroundColor: "#000" },
  mediaWrapper: { flex: 1 },
  mediaFill: { position: "absolute", width: "100%", height: "100%" },
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
