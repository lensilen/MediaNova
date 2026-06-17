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

import { PostGrid } from '../../components/profile/PostGrid';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { getUserPosts } from '../../utils/posts';
import { getUserProfile } from '../../utils/profile';
import { followUser, isFollowing, unfollowUser } from '../../utils/social';
import { profileStyles as styles } from './profileScreenStyles';

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
  const [error, setError] = useState('');

  const visibleProfile = useMemo(() => {
    if (isOwnProfile) {
      return profile || ownProfile || {};
    }

    return profile || {};
  }, [isOwnProfile, ownProfile, profile]);

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

  function handlePostPress(post) {
    Alert.alert(
      post.type === 'audio' ? 'Audio post' : 'Media post',
      post.caption || 'Post ini belum punya caption.',
    );
  }

  const displayName = visibleProfile.displayName || user?.displayName || 'User';
  const email = visibleProfile.email || user?.email || '';
  const photoURL = visibleProfile.photoURL || user?.photoURL || '';
  const bio = visibleProfile.bio || 'Digital creator di MediaNova.';

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
        {email ? <Text style={[styles.email, { color: colors.muted }]}>{email}</Text> : null}
        <Text style={[styles.bio, { color: colors.text }]}>{bio}</Text>
      </View>

      <View style={[styles.stats, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <StatItem colors={colors} label="Post" value={posts.length} />
        <StatItem colors={colors} label="Followers" value={visibleProfile.followers ?? 0} />
        <StatItem colors={colors} label="Following" value={visibleProfile.following ?? 0} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isOwnProfile ? (
        <Pressable
          onPress={() => router.push('/settings')}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.primaryButtonText}>Edit Profile</Text>
        </Pressable>
      ) : (
        <Pressable
          disabled={isFollowLoading}
          onPress={handleFollowToggle}
          style={[
            styles.primaryButton,
            {
              backgroundColor: isFollowed ? colors.surface : colors.primary,
              borderColor: colors.border,
              borderWidth: isFollowed ? 1 : 0,
            },
          ]}>
          {isFollowLoading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: colors.text }]}>
              {isFollowed ? 'Following' : 'Follow'}
            </Text>
          )}
        </Pressable>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Posts</Text>
        <Text style={[styles.sectionMeta, { color: colors.muted }]}>
          Foto, video, dan audio
        </Text>
      </View>

      <PostGrid
        colors={colors}
        isLoading={isRefreshing}
        onPostPress={handlePostPress}
        posts={posts}
      />
    </ScrollView>
  );
}

function StatItem({ colors, label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}
