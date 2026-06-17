import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors as fallbackColors } from '../../constants/theme';

function getPreviewSource(post) {
  const uri = post?.thumbnailURL || (post?.type === 'photo' ? post?.mediaURL : '');
  return uri ? { uri } : null;
}

function getIconName(type) {
  if (type === 'audio') {
    return 'musical-notes';
  }

  if (type === 'video') {
    return 'play';
  }

  return 'image';
}

export function PostGrid({
  colors = fallbackColors,
  isLoading = false,
  onPostPress,
  posts = [],
}) {
  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Memuat post</Text>
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          Konten profil sedang diambil dari Firebase.
        </Text>
      </View>
    );
  }

  if (!posts.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Belum ada post</Text>
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          Foto, video, dan audio yang diposting user akan muncul di sini.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {posts.map((post) => {
        const source = getPreviewSource(post);

        return (
          <Pressable
            key={post.id}
            onPress={() => onPostPress?.(post)}
            style={[styles.tile, { backgroundColor: colors.surface }]}>
            {source ? (
              <Image source={source} style={styles.image} />
            ) : (
              <View style={[styles.fallback, { borderColor: colors.border }]}>
                <Ionicons name={getIconName(post.type)} size={24} color={colors.secondary} />
                <Text
                  numberOfLines={2}
                  style={[styles.caption, { color: colors.text }]}>
                  {post.caption || post.type || 'Post'}
                </Text>
              </View>
            )}

            <View style={styles.typeBadge}>
              <Ionicons name={getIconName(post.type)} size={12} color="#FFFFFF" />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '31.8%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    padding: 8,
    gap: 6,
  },
  caption: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: 'rgba(15, 10, 20, 0.72)',
  },
  emptyState: {
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
