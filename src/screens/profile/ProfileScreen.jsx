import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ConnectionSheet } from '../../components/profile/ConnectionSheet';
import { PostGrid } from '../../components/profile/PostGrid';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { getUserPosts } from '../../utils/posts';
import { getFollowers, getFollowing, getUserProfile } from '../../utils/profile';
import { followUser, isFollowing, unfollowUser } from '../../utils/social';
import { profileStyles as styles } from './profileScreenStyles';

const CONTENT_TABS = ['Video', 'Audio', 'Comment', 'Like', 'Saved'];

function asParamValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { profile: ownProfile, setProfile, user } = useAuth();
  const currentUserId = user?.uid || '';
  const targetUserId = asParamValue(params.userId) || user?.uid || '';
  const isOwnProfile = !targetUserId || targetUserId === currentUserId;
  const [profile, setVisibleProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Video');
  const [connectionSheet, setConnectionSheet] = useState({
    isLoading: false,
    title: '',
    users: [],
    visible: false,
  });
  const [error, setError] = useState('');

  const visibleProfile = useMemo(() => {
    if (isOwnProfile) {
      return profile || ownProfile || {};
    }

    return profile || {};
  }, [isOwnProfile, ownProfile, profile]);
  const displayName = visibleProfile.displayName || user?.displayName || 'User';
  const photoURL = visibleProfile.photoURL || user?.photoURL || '';
  const bio = visibleProfile.bio || 'Digital creator di MediaNova.';
  const location = visibleProfile.location || 'MediaNova Studio';
  const handle = useMemo(() => {
    const source = visibleProfile.email || displayName;
    return `@${source.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '')}`;
  }, [displayName, visibleProfile.email]);
  const visiblePosts = useMemo(() => {
    if (activeTab === 'Video') {
      return posts.filter((post) => post.type === 'video');
    }

    if (activeTab === 'Audio') {
      return posts.filter((post) => post.type === 'audio');
    }

    if (activeTab === 'Saved') {
      return posts;
    }

    return posts.filter((post) => post.type === 'photo');
  }, [activeTab, posts]);

  const loadProfile = useCallback(
    async ({ refresh = false } = {}) => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      setError('');
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [profileResult, postsResult, followResult] = await Promise.all([
        getUserProfile(targetUserId),
        getUserPosts(targetUserId),
        !isOwnProfile && currentUserId
          ? isFollowing(currentUserId, targetUserId)
          : Promise.resolve({ success: true, isFollowing: false }),
      ]);

      if (profileResult.success) {
        setVisibleProfile(profileResult.profile);

        if (isOwnProfile) {
          setProfile(profileResult.profile);
        }
      } else {
        setError(profileResult.error);
      }

      if (postsResult.success) {
        setPosts(postsResult.posts);
      }

      if (followResult.success) {
        setIsFollowed(followResult.isFollowing);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [currentUserId, isOwnProfile, setProfile, targetUserId],
  );

  useEffect(() => {
    const task = setTimeout(() => {
      loadProfile();
    }, 0);

    return () => clearTimeout(task);
  }, [loadProfile]);

  async function handleFollowToggle() {
    if (!currentUserId || !targetUserId) {
      Alert.alert('Follow gagal', 'Kamu harus login terlebih dahulu.');
      return;
    }

    setIsFollowLoading(true);
    const result = isFollowed
      ? await unfollowUser(currentUserId, targetUserId)
      : await followUser(currentUserId, targetUserId);
    setIsFollowLoading(false);

    if (!result.success) {
      Alert.alert('Follow gagal', result.error || 'Coba lagi.');
      return;
    }

    setIsFollowed(result.following);
    loadProfile({ refresh: true });
  }

  async function handleConnectionPress(type) {
    if (!targetUserId) {
      return;
    }

    const title = type === 'followers' ? 'Followers' : 'Following';
    setConnectionSheet({ isLoading: true, title, users: [], visible: true });

    const result =
      type === 'followers'
        ? await getFollowers(targetUserId)
        : await getFollowing(targetUserId);

    setConnectionSheet({
      isLoading: false,
      title,
      users: result.success ? result[type] : [],
      visible: true,
    });

    if (!result.success) {
      Alert.alert(`${title} gagal dibuka`, result.error || 'Coba lagi.');
    }
  }

  function handlePostPress(post) {
    Alert.alert(
      post.type === 'audio' ? 'Audio post' : 'Media post',
      post.caption || 'Post ini belum punya caption.',
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.stateText, { color: colors.muted }]}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadProfile({ refresh: true })}
          tintColor={colors.primary}
        />
      }
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={[styles.brand, { color: colors.text }]}>MediaNova</Text>
        {isOwnProfile ? (
          <Pressable
            onPress={() => router.push('/settings')}
            style={[styles.iconButton, { borderColor: colors.border }]}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.header}>
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
        <Text style={[styles.email, { color: colors.muted }]}>{handle}</Text>
        <Text style={[styles.bio, { color: colors.text }]}>{bio}</Text>
        <Text style={[styles.location, { color: colors.muted }]}>Pin {location}</Text>
      </View>

      <View style={[styles.stats, { borderColor: colors.border }]}>
        <StatItem colors={colors} label="Post" value={posts.length} />
        <StatItem
          colors={colors}
          label="Followers"
          onPress={() => handleConnectionPress('followers')}
          value={visibleProfile.followers ?? 0}
        />
        <StatItem
          colors={colors}
          label="Following"
          onPress={() => handleConnectionPress('following')}
          value={visibleProfile.following ?? 0}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!isOwnProfile ? (
        <Pressable
          disabled={isFollowLoading}
          onPress={handleFollowToggle}
          style={[
            styles.primaryButton,
            {
              backgroundColor: isFollowed ? colors.surface : colors.text,
              borderColor: colors.border,
              borderWidth: isFollowed ? 1 : 0,
            },
          ]}>
          {isFollowLoading ? (
            <ActivityIndicator color={isFollowed ? colors.text : colors.surface} />
          ) : (
            <Text
              style={[
                styles.primaryButtonText,
                { color: isFollowed ? colors.text : colors.surface },
              ]}>
              {isFollowed ? 'Following' : 'Follow'}
            </Text>
          )}
        </Pressable>
      ) : null}

      <View style={[styles.tabBar, { borderColor: colors.border }]}>
        {CONTENT_TABS.map((tab) => {
          const isActive = activeTab === tab;

          return (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
              <Text style={[styles.tabText, { color: isActive ? colors.text : colors.muted }]}>
                {tab}
              </Text>
              {isActive ? <View style={[styles.tabLine, { backgroundColor: colors.text }]} /> : null}
            </Pressable>
          );
        })}
      </View>

      <PostGrid
        colors={colors}
        isLoading={isRefreshing}
        onPostPress={handlePostPress}
        posts={visiblePosts}
      />

      <ConnectionSheet
        colors={colors}
        isLoading={connectionSheet.isLoading}
        onClose={() => setConnectionSheet((state) => ({ ...state, visible: false }))}
        onUserPress={(item) => {
          setConnectionSheet((state) => ({ ...state, visible: false }));
          router.push({ pathname: '/(tabs)/profile', params: { userId: item.id } });
        }}
        title={connectionSheet.title}
        users={connectionSheet.users}
        visible={connectionSheet.visible}
      />
    </ScrollView>
  );
}

function formatCount(value) {
  const count = Number(value || 0);
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

function StatItem({ colors, label, onPress, value }) {
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper onPress={onPress} style={styles.statItem}>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{formatCount(value)}</Text>
    </Wrapper>
  );
}
