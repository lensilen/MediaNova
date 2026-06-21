import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useRouter } from "expo-router"; // 1. Gunakan useRouter dari expo-router

import { ActionButtons } from "./ActionButtons";
import { CommentSheet } from "./CommentSheet";
import { colors } from "../../constants/theme";
import { useSocialStore } from "../../store/useSocialStore";

const { height } = Dimensions.get("window");

const dummyComments = [
  {
    id: "1",
    name: "Sarah Jenkins",
    text: "This layout is amazing.",
    avatar: "https://i.pravatar.cc/150?img=11",
  },
  {
    id: "2",
    name: "David Chen",
    text: "Looks clean and modern.",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
];

export function VideoCard({
  post,
  isActive = false,
  onProfilePress,
  onComment,
  onShare,
}) {
  const router = useRouter(); // 2. Inisialisasi router

  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(dummyComments.length);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const { likedPosts, savedPosts, toggleLike, toggleSave } = useSocialStore();

  const liked = likedPosts.some((item) => item.id === post.id);
  const saved = savedPosts.some((item) => item.id === post.id);

  const displayedLikes = (post?.likes || 0) + (liked ? 1 : 0);
  const displayedSaves = (post?.saves || 0) + (saved ? 1 : 0);

  const player = useVideoPlayer(
    post?.mediaURL || "https://www.w3schools.com/html/mov_bbb.mp4"
  );

  useEffect(() => {
    if (!player) return;

    player.loop = true;
    player.muted = false;

    if (isActive && !isPaused) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, isActive, isPaused]);

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      try {
        const current = player.currentTime || 0;
        const duration = player.duration || 1;

        setProgress(current / duration);
      } catch (error) {}
    }, 250);

    return () => clearInterval(interval);
  }, [player]);

  const handleVideoPress = () => {
    if (!player) return;

    if (isPaused) {
      player.play();
    } else {
      player.pause();
    }

    setIsPaused(!isPaused);
  };

  // 3. Fungsi Navigasi yang disesuaikan untuk Expo Router
  // Cari fungsi ini di dalam VideoCard.jsx milikmu
const handleProfileNavigation = () => {
  // Langsung paksa menggunakan expo-router tanpa mengecek props onProfilePress
  router.push({
    pathname: "/profile",
    params: { username: post?.username || "student_creator" }
  }); 
};

  return (
    <View style={styles.container}>
      <Pressable style={styles.videoWrapper} onPress={handleVideoPress}>
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
        likes={displayedLikes}
        comments={commentCount}
        saves={displayedSaves}
        liked={liked}
        saved={saved}
        onLike={() => toggleLike(post)}
        onComment={() => {
          setShowComments(true);
          onComment?.(post);
        }}
        onSave={() => toggleSave(post)}
        onShare={() => onShare?.(post)}
      />

      <View style={styles.timelineWrapper}>
        <Text style={styles.timeText}>
          {Math.floor(player?.currentTime || 0)}
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
          {Math.floor(player?.duration || 0)}
        </Text>
      </View>

      <CommentSheet
        visible={showComments}
        onClose={() => setShowComments(false)}
        comments={dummyComments}
        onCommentAdded={() => setCommentCount((prev) => prev + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: height, backgroundColor: "#000" },
  videoWrapper: { flex: 1 },
  video: { position: "absolute", width: "100%", height: "100%" },
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