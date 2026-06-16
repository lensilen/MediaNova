import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { useFeed } from "../../hooks/useFeed";

function getCreatedAtLabel(createdAt) {
  if (!createdAt) {
    return "";
  }

  if (typeof createdAt.toDate === "function") {
    return createdAt.toDate().toLocaleDateString("id-ID");
  }

  return "";
}

export function FeedScreen() {
  const { isAuthenticated } = useAuth();
  const { error, hasMore, isLoading, isRefreshing, loadFeed, loadMore, posts } =
    useFeed();

  useEffect(() => {
    if (isAuthenticated) {
      loadFeed({ refresh: true });
    }
  }, [isAuthenticated, loadFeed]);

  function renderPost({ item }) {
    return (
      <View style={styles.postItem}>
        <View style={styles.postHeader}>
          <Text style={styles.type}>{item.type}</Text>
          <Text style={styles.date}>{getCreatedAtLabel(item.createdAt)}</Text>
        </View>
        <Text style={styles.caption} numberOfLines={3}>
          {item.caption || "Tanpa caption"}
        </Text>
        <Text style={styles.meta}>
          {item.likes ?? 0} likes - {item.commentsCount ?? 0} comments
        </Text>
      </View>
    );
  }

  function renderEmpty() {
    if (isLoading) {
      return null;
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Belum ada post</Text>
        <Text style={styles.emptyText}>
          Post dari Firebase akan tampil di sini.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          isLoading && posts.length > 0 ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null
        }
        onEndReached={() => {
          if (hasMore) {
            loadMore();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadFeed({ refresh: true })}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 56,
  },
  postItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  type: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  date: {
    color: colors.muted,
    fontSize: 12,
  },
  caption: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
  },
  error: {
    color: "#FCA5A5",
    backgroundColor: "#7F1D1D",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loader: {
    marginVertical: 18,
  },
});
