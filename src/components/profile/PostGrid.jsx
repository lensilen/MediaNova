import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors as fallbackColors } from "../../constants/theme";

function getPreviewSource(post) {
  if (!post) return null;

  const uri =
    post.thumbnailURL ||
    post.photoURL ||
    (post.type === "photo"
      ? post.mediaURL
      : "");

  return uri ? { uri } : null;
}

function getIconName(type) {
  switch (type) {
    case "video":
      return "play";

    case "audio":
      return "musical-notes";

    case "comment":
      return "chatbubble";

    default:
      return "image";
  }
}

function getCaption(post) {
  if (post?.activityType === "comments" && post.activityText) {
    return post.activityText;
  }

  return post?.caption || "MediaNova";
}

export function PostGrid({
  colors = fallbackColors,
  isLoading = false,
  posts = [],
  onPostPress,
}) {
  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <Text
          style={[
            styles.emptyTitle,
            { color: colors.text },
          ]}
        >
          Memuat post...
        </Text>
      </View>
    );
  }

  if (!posts?.length) {
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="images-outline"
          size={50}
          color={colors.muted}
        />

        <Text
          style={[
            styles.emptyTitle,
            { color: colors.text },
          ]}
        >
          Belum ada post
        </Text>

        <Text
          style={[
            styles.emptyText,
            { color: colors.muted },
          ]}
        >
          Post yang dibuat atau
          disimpan akan muncul di sini.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {posts.map((post) => {
        const source =
          getPreviewSource(post);

        return (
          <Pressable
            key={post.id}
            onPress={() =>
              onPostPress?.(post)
            }
            style={[
              styles.tile,
              {
                backgroundColor:
                  colors.surface,
              },
            ]}
          >
            {source ? (
              <Image
                source={source}
                style={styles.image}
              />
            ) : (
              <View
                style={[
                  styles.fallback,
                  {
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={getIconName(
                    post.type
                  )}
                  size={26}
                  color={
                    colors.secondary
                  }
                />

                <Text
                  numberOfLines={2}
                  style={[
                    styles.caption,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  {getCaption(post)}
                </Text>
              </View>
            )}

            <View style={styles.badge}>
              <Ionicons
                name={getIconName(
                  post.type
                )}
                size={12}
                color="#FFF"
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tile: {
    width: "31.8%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  fallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    padding: 8,
    gap: 6,
  },

  caption: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "700",
  },

  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.65)",
  },

  emptyState: {
    minHeight: 220,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 8,
  },

  emptyText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
  },
});
