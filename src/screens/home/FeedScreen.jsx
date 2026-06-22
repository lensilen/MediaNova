import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Share,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { VideoCard } from "../../components/home/VideoCard";
import { colors } from "../../constants/theme";

const dummyVideos = [
  {
    id: "1",
    type: "video",
    username: "student_creator",
    photoURL: "https://i.pravatar.cc/150?img=1",
    caption: "Exploring the new library! #campuslife",
    mediaURL:
      "https://www.w3schools.com/html/mov_bbb.mp4",
    likes: 12400,
    comments: 342,
    saves: 89,
    currentTime: "1:04",
    duration: "3:42",
  },

];

export default function FeedScreen() {
  const [activeId, setActiveId] = useState(
    dummyVideos[0].id
  );

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

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 80,
  }), []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      if (
        viewableItems &&
        viewableItems.length > 0
      ) {
        setActiveId(
          viewableItems[0].item.id
        );
      }
    },
    []
  );

  const renderItem = useCallback(
    ({ item }) => (
      <VideoCard
        post={item}
        isActive={activeId === item.id}
        onProfilePress={() => {
          console.log(
            "Profile:",
            item.username
          );
        }}
        onLike={() => {
          console.log("Like:", item.id);
        }}
        onComment={() => {
          console.log(
            "Comment:",
            item.id
          );
        }}
        onSave={() => {
          console.log("Save:", item.id);
        }}
        onShare={handleShare}
      />
    ),
    [activeId, handleShare]
  );

  if (!dummyVideos.length) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons
          name="notifications-outline"
          size={22}
          color="#FFFFFF"
        />

        <Text style={styles.logo}>
          MediaNova
        </Text>

        <Ionicons
          name="search-outline"
          size={22}
          color="#FFFFFF"
        />
      </View>

      {/* FEED */}
      <FlatList
        data={dummyVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={
          onViewableItemsChanged
        }
        viewabilityConfig={
          viewabilityConfig
        }
        removeClippedSubviews
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      colors.background,
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
    backgroundColor:
      colors.background,
  },
});
