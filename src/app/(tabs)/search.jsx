import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  ImageBackground,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchPosts, searchUsers } from '../../utils/social';

const RECENT_SEARCHES_KEY = 'medianova:recent-searches';

const defaultRecentSearches = [
  'minimalist UI design',
  'lofi hip hop beats',
  'cinematic drone footage',
];

const trendingTags = [
  '#WorldCup2026',
  'Hasil Pertandingan Malam Ini',
  'Demo 19 Juni',
  'IHSG Naik!',
];

const featuredCollections = [
  {
    title: 'Demo di Bundaran HI!',
    views: '1.2M views',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2JX9P4hblh3QS2MHADAL12qWwBfbSpblJYA&s',
  },
  {
    title: 'BGN Akan Tutup MBG Selama Libur Sekolah',
    views: '840K views',
    image:
      'data:image/jpeg;base64,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',
  },
];

export default function Search() {
  const router = useRouter();
  const searchRequestId = useRef(0);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(defaultRecentSearches);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRecentSearches() {
      try {
        const storedValue = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        const parsedValue = storedValue ? JSON.parse(storedValue) : null;

        if (isMounted && Array.isArray(parsedValue) && parsedValue.length > 0) {
          setRecentSearches(parsedValue);
        }
      } catch {
        if (isMounted) {
          setRecentSearches(defaultRecentSearches);
        }
      }
    }

    loadRecentSearches();

    return () => {
      isMounted = false;
    };
  }, []);

  async function persistRecentSearches(nextSearches) {
    setRecentSearches(nextSearches);

    try {
      await AsyncStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(nextSearches),
      );
    } catch {}
  }

  async function addRecentSearch(searchTerm) {
    const cleanSearchTerm = searchTerm.trim();

    if (!cleanSearchTerm) {
      return;
    }

    const nextSearches = [
      cleanSearchTerm,
      ...recentSearches.filter(
        (item) => item.toLowerCase() !== cleanSearchTerm.toLowerCase(),
      ),
    ].slice(0, 5);

    await persistRecentSearches(nextSearches);
  }

  async function clearRecentSearches() {
    await persistRecentSearches([]);
  }

  async function runSearch(searchTerm, options = {}) {
    const cleanSearchTerm = searchTerm.trim();

    if (!cleanSearchTerm) {
      setQuery('');
      return;
    }

    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    setActiveQuery(cleanSearchTerm);
    setIsSearching(true);
    setError('');

    if (options.saveRecent) {
      await addRecentSearch(cleanSearchTerm);
    }

    const [usersResult, postsResult] = await Promise.all([
      searchUsers(cleanSearchTerm, 8),
      searchPosts(cleanSearchTerm, 12),
    ]);

    if (searchRequestId.current !== requestId) {
      return;
    }

    setUsers(usersResult.success ? usersResult.users : []);
    setPosts(postsResult.success ? postsResult.posts : []);

    if (!usersResult.success || !postsResult.success) {
      setError(usersResult.error || postsResult.error || 'Search gagal.');
    }

    setIsSearching(false);
  }

  function handleSubmitSearch() {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return;
    }

    runSearch(cleanQuery, { saveRecent: true });
  }

  function handleChangeQuery(nextQuery) {
    setQuery(nextQuery);

    if (!nextQuery.trim()) {
      searchRequestId.current += 1;
      setActiveQuery('');
      setUsers([]);
      setPosts([]);
      setError('');
      setIsSearching(false);
    }
  }

  function handleShortcutSearch(searchTerm) {
    setQuery(searchTerm);
    runSearch(searchTerm, { saveRecent: true });
  }

  function handleCreatorPress(user) {
    const userId = user?.id || user?.uid;

    if (!userId) {
      return;
    }

    router.push({
      pathname: '/(tabs)/profile',
      params: { userId },
    });
  }

  function handleBackPress() {
    if (activeQuery || query) {
      searchRequestId.current += 1;
      setQuery('');
      setActiveQuery('');
      setUsers([]);
      setPosts([]);
      setError('');
      setIsSearching(false);
      return;
    }

    router.back();
  }

  const isShowingResults = Boolean(activeQuery);
  const totalResults = users.length + posts.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={handleBackPress}
            style={styles.iconButton}>
            <Ionicons color={palette.ink} name="arrow-back" size={23} />
          </Pressable>
          <Text style={styles.brand}>MediaNova</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchBox}>
          <Ionicons color={palette.muted} name="search" size={20} />
          <TextInput
            autoCapitalize="none"
            onChangeText={handleChangeQuery}
            onSubmitEditing={handleSubmitSearch}
            placeholder="Search creators, videos, audio..."
            placeholderTextColor={palette.muted}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {isSearching ? (
            <ActivityIndicator color={palette.ink} size="small" />
          ) : null}
        </View>

        {isShowingResults ? (
          <View style={styles.resultsArea}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Results</Text>
              <Text style={styles.resultCount}>{totalResults} found</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {users.length > 0 ? (
              <View style={styles.resultGroup}>
                <Text style={styles.resultGroupTitle}>Creators</Text>
                {users.map((user) => (
                  <Pressable
                    key={user.id}
                    onPress={() => handleCreatorPress(user)}
                    style={styles.userResult}>
                    {user.photoURL ? (
                      <Image
                        source={{ uri: user.photoURL }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Ionicons color={palette.white} name="person" size={18} />
                      </View>
                    )}
                    <View style={styles.resultCopy}>
                      <Text numberOfLines={1} style={styles.resultTitle}>
                        {user.displayName || 'User'}
                      </Text>
                      <Text numberOfLines={1} style={styles.resultSubtitle}>
                        {user.bio || user.email || 'MediaNova creator'}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {posts.length > 0 ? (
              <View style={styles.resultGroup}>
                <Text style={styles.resultGroupTitle}>Posts</Text>
                {posts.map((post) => (
                  <Pressable key={post.id} style={styles.postResult}>
                    <View style={styles.postIcon}>
                      <Ionicons
                        color={palette.ink}
                        name={getPostIcon(post.type)}
                        size={20}
                      />
                    </View>
                    <View style={styles.resultCopy}>
                      <Text numberOfLines={2} style={styles.resultTitle}>
                        {post.caption || 'Tanpa caption'}
                      </Text>
                      <Text style={styles.resultSubtitle}>
                        {formatPostMeta(post)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {!isSearching && !error && totalResults === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons color={palette.muted} name="search" size={28} />
                <Text style={styles.emptyTitle}>Tidak ada hasil</Text>
                <Text style={styles.emptyText}>
                  Coba keyword lain atau cari nama creator yang lebih spesifik.
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              {recentSearches.length > 0 ? (
                <Pressable hitSlop={10} onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>CLEAR ALL</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.recentList}>
              {recentSearches.length > 0 ? (
                recentSearches.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => handleShortcutSearch(item)}
                    style={styles.recentItem}>
                    <Ionicons
                      color={palette.ink}
                      name="refresh-outline"
                      size={19}
                    />
                    <Text style={styles.recentText}>{item}</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyRecent}>Belum ada recent search.</Text>
              )}
            </View>

            <Text style={[styles.sectionTitle, styles.trendingTitle]}>
              Trending
            </Text>
            <View style={styles.tagCloud}>
              {trendingTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => handleShortcutSearch(tag.replace('#', ''))}
                  style={styles.tagPill}>
                  <Ionicons color={palette.ink} name="trending-up" size={13} />
                  <Text style={styles.tagText}>{tag}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.cardGrid}>
              {featuredCollections.map((item) => (
                <Pressable
                  key={item.title}
                  onPress={() => handleShortcutSearch(item.title)}
                  style={styles.featureCard}>
                  <ImageBackground
                    imageStyle={styles.cardImage}
                    source={{ uri: item.image }}
                    style={styles.cardBackground}>
                    <View style={styles.cardShade} />
                    <View style={styles.cardText}>
                      <Text numberOfLines={1} style={styles.cardTitle}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardViews}>{item.views}</Text>
                    </View>
                  </ImageBackground>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getPostIcon(type) {
  const icons = {
    audio: 'musical-notes',
    photo: 'image',
    video: 'videocam',
  };

  return icons[type] || 'albums';
}

function formatPostMeta(post) {
  const type = post.type ? post.type.toUpperCase() : 'POST';
  const likes = post.likes ?? 0;
  const comments = post.commentsCount ?? 0;

  return `${type} - ${likes} likes - ${comments} comments`;
}

const palette = {
  page: '#FCF7F2',
  ink: '#142132',
  muted: '#7E7B80',
  soft: '#EEE8E5',
  chip: '#EDE8E5',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.page,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  brand: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 36,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: palette.soft,
    borderRadius: 22,
    flexDirection: 'row',
    gap: 10,
    height: 46,
    paddingHorizontal: 18,
  },
  searchInput: {
    color: palette.ink,
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 34,
  },
  sectionTitle: {
    color: '#151515',
    fontSize: 19,
    fontWeight: '800',
  },
  clearText: {
    color: '#59545A',
    fontSize: 10,
    fontWeight: '800',
  },
  recentList: {
    gap: 21,
    marginTop: 22,
  },
  recentItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 15,
  },
  recentText: {
    color: '#2C282D',
    fontSize: 14,
  },
  trendingTitle: {
    marginTop: 47,
  },
  tagCloud: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  tagPill: {
    alignItems: 'center',
    backgroundColor: palette.chip,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 4,
    minHeight: 31,
    paddingHorizontal: 14,
  },
  tagText: {
    color: '#232027',
    fontSize: 13,
    fontWeight: '600',
  },
  cardGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 21,
  },
  featureCard: {
    aspectRatio: 0.78,
    borderRadius: 8,
    flex: 1,
    overflow: 'hidden',
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardImage: {
    borderRadius: 8,
  },
  cardShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
  },
  cardText: {
    padding: 10,
  },
  cardTitle: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '800',
  },
  cardViews: {
    color: palette.white,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
});
