import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '../../constants/theme';
import { searchPosts, searchUsers } from '../../utils/social';

function buildRows(users, posts) {
  return [
    ...users.map((user) => ({ ...user, resultType: 'user' })),
    ...posts.map((post) => ({ ...post, resultType: 'post' })),
  ];
}

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch() {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setUsers([]);
      setPosts([]);
      setError('');
      return;
    }

    setIsSearching(true);
    setError('');

    const [usersResult, postsResult] = await Promise.all([
      searchUsers(cleanQuery),
      searchPosts(cleanQuery),
    ]);

    if (usersResult.success) {
      setUsers(usersResult.users);
    }

    if (postsResult.success) {
      setPosts(postsResult.posts);
    }

    if (!usersResult.success || !postsResult.success) {
      setError(usersResult.error || postsResult.error || 'Search gagal.');
    }

    setIsSearching(false);
  }

  function renderResult({ item }) {
    const isUser = item.resultType === 'user';
    const title = isUser ? item.displayName || 'User' : item.caption || 'Post';
    const subtitle = isUser ? item.email || item.bio || '' : item.type || '';

    return (
      <View style={styles.resultItem}>
        <Text style={styles.resultType}>{isUser ? 'User' : 'Post'}</Text>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    );
  }

  const rows = buildRows(users, posts);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          autoCapitalize="none"
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          placeholder="Cari user atau post"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        <Pressable
          disabled={isSearching}
          onPress={handleSearch}
          style={[styles.button, isSearching && styles.buttonDisabled]}>
          {isSearching ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Cari</Text>
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={rows}
        keyExtractor={(item) => `${item.resultType}-${item.id}`}
        renderItem={renderResult}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isSearching ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Belum ada hasil</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    paddingTop: 56,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  button: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  error: {
    color: '#FCA5A5',
    marginBottom: 12,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  resultItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: 14,
    marginBottom: 10,
  },
  resultType: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  resultTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  resultSubtitle: {
    color: colors.muted,
    marginTop: 6,
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.muted,
    fontSize: 15,
  },
});
