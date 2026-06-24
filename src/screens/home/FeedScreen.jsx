import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  Share,
  Text,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, usePathname, useRouter } from "expo-router";

import { VideoCard } from "../../components/home/VideoCard";
import { TAB_BAR_HEIGHT } from "../../constants/layout";
import { colors } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { useFeed } from "../../hooks/useFeed";
import {
  getNotifications,
  markNotificationAsRead,
} from "../../utils/notifications";
import { subscribeFeedPosts } from "../../utils/posts";
import { useFeedStore } from "../../store/feedStore";

const dummyVideos = [
  {
    id: "1",
    type: "video",
    username: "medianova_demo",
    photoURL: "https://i.pravatar.cc/150?img=1",
    caption: "Demo feed MediaNova. Upload post baru untuk melihat konten asli.",
    mediaURL: "https://www.w3schools.com/html/mov_bbb.mp4",
    likes: 12400,
    comments: 342,
    saves: 89,
    currentTime: "1:04",
    duration: "3:42",
  },
];

export default function FeedScreen() {
  const listRef = useRef(null);
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { user } = useAuth();
  const pathname = usePathname();
  const isFocused = pathname === "/";
  const { posts, hasMore, isLoading, isRefreshing, error, loadFeed, loadMore } =
    useFeed({ pageSize: 8 });
  const feedPosts = useMemo(
    () =>
      posts.length
        ? posts
        : dummyVideos.map((video) => ({ ...video, isDemo: true })),
    [posts],
  );
  const [activeId, setActiveId] = useState(feedPosts[0]?.id || "");
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const activePostId = feedPosts.some((post) => post.id === activeId)
    ? activeId
    : feedPosts[0]?.id || "";
  const feedHeight = Math.max(height - TAB_BAR_HEIGHT, 360);

  const handleShare = useCallback(async (post) => {
    const caption = post?.caption || "MediaNova post";
    const mediaURL = post?.mediaURL || "";
    const username = post?.username ? `@${post.username}` : "MediaNova";
    const message = mediaURL
      ? `${caption}\n${username}\n${mediaURL}`
      : `${caption}\n${username}`;

    try {
      await Share.share({
        message,
        title: caption,
        url: mediaURL,
      });
    } catch {
      Alert.alert("Share gagal", "Post belum bisa dibagikan. Coba lagi.");
    }
  }, []);

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 80,
    }),
    [],
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveId(viewableItems[0].item.id);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <VideoCard
        post={item}
        feedHeight={feedHeight}
        isActive={isFocused && activePostId === item.id}
        onShare={handleShare}
      />
    ),
    [activePostId, feedHeight, handleShare, isFocused],
  );

  const openNotifications = useCallback(async () => {
    if (!user?.uid) {
      Alert.alert("Login dibutuhkan", "Masuk dulu untuk melihat notifikasi.");
      return;
    }

    setNotificationVisible(true);
    setNotificationLoading(true);

    const result = await getNotifications(user.uid);

    if (result.success) {
      setNotifications(result.notifications);
      result.notifications
        .filter((item) => item.read === false)
        .slice(0, 10)
        .forEach((item) => {
          markNotificationAsRead(item.id);
        });
    } else {
      Alert.alert("Notifikasi gagal", result.error);
    }

    setNotificationLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      const store = useFeedStore.getState();
      store.setError(null);

      const unsubscribe = subscribeFeedPosts(
        8,
        (nextPosts, lastVisibleDoc) => {
          const nextStore = useFeedStore.getState();
          nextStore.setPosts(nextPosts);
          nextStore.setPagination({
            lastDoc: lastVisibleDoc,
            hasMore: nextPosts.length >= 8,
          });
          nextStore.setLoading(false);
          nextStore.setRefreshing(false);
        },
        (message) => {
          useFeedStore.getState().setError(message);
          loadFeed({ refresh: true });
        },
      );

      return () => {
        unsubscribe();
        setActiveId(dummyVideos[0]?.id || "");
        listRef.current?.scrollToOffset?.({ animated: false, offset: 0 });
      };
    }, [loadFeed]),
  );

  if (isLoading && !feedPosts.length) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={openNotifications}>
          <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.logo}>MediaNova</Text>

        <Pressable onPress={() => router.push("/search")}>
          <Ionicons name="search-outline" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorPill}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* FEED */}
      <FlatList
        ref={listRef}
        data={feedPosts}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          index,
          length: feedHeight,
          offset: feedHeight * index,
        })}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        snapToAlignment="start"
        snapToInterval={feedHeight}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadFeed({ refresh: true })}
            tintColor="#FFFFFF"
          />
        }
        onEndReached={() => {
          if (hasMore) loadMore();
        }}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
      />

      <NotificationModal
        isLoading={notificationLoading}
        notifications={notifications}
        onClose={() => setNotificationVisible(false)}
        visible={notificationVisible}
      />
    </View>
  );
}

function getNotificationText(item) {
  const actor = item?.fromUserId
    ? `User ${item.fromUserId.slice(0, 6)}`
    : "Seseorang";

  switch (item?.type) {
    case "follow":
      return `${actor} mulai follow akun kamu.`;
    case "like":
      return `${actor} menyukai media kamu.`;
    case "comment":
      return `${actor} memberi komentar di media kamu.`;
    case "save":
      return `${actor} menyimpan media kamu.`;
    case "mention":
      return `${actor} mention/tag akun kamu.`;
    default:
      return "Ada aktivitas baru di MediaNova.";
  }
}

function NotificationModal({ isLoading, notifications, onClose, visible }) {
  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.notificationSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Notifications</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : notifications.length ? (
            notifications.map((item) => (
              <View key={item.id} style={styles.notificationRow}>
                <Ionicons
                  name={item.read ? "notifications-outline" : "notifications"}
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.notificationText}>
                  {getNotificationText(item)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyNotification}>Belum ada notifikasi.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    position: "absolute",
    top: 25,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorPill: {
    left: 24,
    position: "absolute",
    right: 24,
    top: 72,
    zIndex: 1000,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 10,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  notificationSheet: {
    minHeight: 260,
    maxHeight: "70%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    backgroundColor: colors.surface,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notificationText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyNotification: {
    color: colors.muted,
    marginTop: 24,
    textAlign: "center",
  },
});
