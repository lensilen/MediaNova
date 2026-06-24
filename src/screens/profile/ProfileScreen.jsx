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
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { ConnectionSheet } from '../../components/profile/ConnectionSheet';
import { PostGrid } from '../../components/profile/PostGrid';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { db } from '../../utils/firebase';
import { getPostById, getUserPosts } from '../../utils/posts';
import {
  getCommentedPosts,
  getFollowers,
  getFollowing,
  getLikedPosts,
  getSavedPosts,
  getUserProfile,
} from '../../utils/profile';
import { followUser, isFollowing, unfollowUser } from '../../utils/social';
import { profileStyles as styles } from './profileScreenStyles';

const CONTENT_TABS = ['Media', 'Comment', 'Like', 'Saved'];

function asParamValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getCreatedTime(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return Number(value) || 0;
}

function sortNewestPosts(items) {
  return [...items].sort(
    (first, second) =>
      getCreatedTime(second.createdAt) - getCreatedTime(first.createdAt),
  );
}

function normalizeActivitySnapshot(snapshot) {
  return snapshot.docs.map((activityDoc) => ({
    id: activityDoc.id,
    ...activityDoc.data(),
  }));
}

export function ProfileScreen({
  embeddedUserId = '',
  onBackPress,
  onUserProfilePress,
} = {}) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { profile: ownProfile, setProfile, user } = useAuth();
  const currentUserId = user?.uid || '';
  const targetUserId = embeddedUserId || asParamValue(params.userId) || user?.uid || '';
  const isOwnProfile = !targetUserId || targetUserId === currentUserId;
  const isEmbedded = Boolean(embeddedUserId || onBackPress);
  const [profile, setVisibleProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  
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

  const displayName = isOwnProfile
    ? (visibleProfile.displayName || user?.displayName || 'User')
    : (visibleProfile.displayName || 'User');
  const photoURL = isOwnProfile
    ? (visibleProfile.photoURL || user?.photoURL || '')
    : (visibleProfile.photoURL || '');
  const bio = visibleProfile.bio || 'Digital creator di MediaNova.';
  const location = visibleProfile.location || 'MediaNova Studio';
  
  const handle = useMemo(() => {
    const source = visibleProfile.email || displayName;
    return `@${source.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '')}`;
  }, [displayName, visibleProfile.email]);

  const visiblePosts = useMemo(() => {
    if (activeTab === "Media") {
      return posts;
    }

    if (activeTab === "Comment") {
      return commentedPosts.filter((post) => post.userId !== targetUserId);
    }

    if (activeTab === "Saved") {
      return savedPosts.filter((post) => post.userId !== targetUserId);
    }

    if (activeTab === "Like") {
      return likedPosts.filter((post) => post.userId !== targetUserId);
    }

    return posts;
  }, [
    activeTab,
    commentedPosts,
    likedPosts,
    posts,
    savedPosts,
    targetUserId,
  ]);

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

      const [
        profileResult,
        postsResult,
        commentResult,
        likeResult,
        saveResult,
        followResult,
      ] = await Promise.all([
        getUserProfile(targetUserId),
        getUserPosts(targetUserId),
        getCommentedPosts(targetUserId),
        getLikedPosts(targetUserId),
        isOwnProfile
          ? getSavedPosts(targetUserId)
          : Promise.resolve({ success: true, posts: [] }),
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

      if (commentResult.success) {
        setCommentedPosts(commentResult.posts);
      }

      if (likeResult.success) {
        setLikedPosts(likeResult.posts);
      }

      if (saveResult.success) {
        setSavedPosts(saveResult.posts);
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

  useEffect(() => {
    if (!targetUserId) {
      return undefined;
    }

    const profileRef = doc(db, 'users', targetUserId);
    const postsRef = query(
      collection(db, 'posts'),
      where('userId', '==', targetUserId),
    );

    const stopProfile = onSnapshot(profileRef, (snapshot) => {
      if (!snapshot.exists()) {
        return;
      }

      const nextProfile = { id: snapshot.id, ...snapshot.data() };
      setVisibleProfile(nextProfile);

      if (isOwnProfile) {
        setProfile(nextProfile);
      }
    });

    const stopPosts = onSnapshot(postsRef, (snapshot) => {
      const nextPosts = snapshot.docs.map((postDoc) => ({
        id: postDoc.id,
        ...postDoc.data(),
      }));

      setPosts(sortNewestPosts(nextPosts));
    });

    return () => {
      stopProfile();
      stopPosts();
    };
  }, [isOwnProfile, setProfile, targetUserId]);

  useEffect(() => {
    if (!targetUserId) {
      return undefined;
    }

    let isActive = true;

    async function setPostsFromActivities(snapshot, type, setter) {
      const activities = normalizeActivitySnapshot(snapshot);
      const postResults = await Promise.all(
        activities.map((activity) => getPostById(activity.postId)),
      );

      if (!isActive) {
        return;
      }

      const nextPosts = postResults
        .map((result, index) => {
          if (!result.success) {
            return null;
          }

          return {
            ...result.post,
            activityId: activities[index].id,
            activityText: activities[index].text || '',
            activityType: type,
          };
        })
        .filter(Boolean);

      setter(sortNewestPosts(nextPosts));
    }

    const activityQuery = (collectionName) =>
      query(collection(db, collectionName), where('userId', '==', targetUserId));

    const stopComments = onSnapshot(activityQuery('comments'), (snapshot) => {
      setPostsFromActivities(snapshot, 'comments', setCommentedPosts);
    });
    const stopLikes = onSnapshot(activityQuery('likes'), (snapshot) => {
      setPostsFromActivities(snapshot, 'likes', setLikedPosts);
    });
    const stopSaves = isOwnProfile
      ? onSnapshot(activityQuery('saves'), (snapshot) => {
          setPostsFromActivities(snapshot, 'saves', setSavedPosts);
        })
      : () => {};

    return () => {
      isActive = false;
      stopComments();
      stopLikes();
      stopSaves();
    };
  }, [isOwnProfile, targetUserId]);

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
    if (!post?.mediaURL) {
      Alert.alert('Media belum tersedia', 'Post ini belum punya URL media.');
      return;
    }

    router.push({
      pathname: '/media-viewer',
      params: {
        caption: post.caption || '',
        title: post.title || post.caption || 'MediaNova',
        type: post.type || 'video',
        uri: post.mediaURL,
      },
    });
  }

  function handleUserProfilePress(item) {
    const nextUserId = item?.id || item?.uid;

    if (!nextUserId) {
      return;
    }

    setConnectionSheet((state) => ({ ...state, visible: false }));

    if (onUserProfilePress) {
      onUserProfilePress(nextUserId);
      return;
    }

    router.push({ pathname: '/(tabs)/profile', params: { userId: nextUserId } });
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
        {isEmbedded ? (
          <Pressable
            onPress={onBackPress}
            style={[styles.iconButton, { borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        ) : null}
        <Text style={[styles.brand, { color: colors.text }]}>MediaNova</Text>
        {isOwnProfile && !isEmbedded ? (
          <Pressable
            onPress={() => router.push('/settings')}
            style={[styles.iconButton, { borderColor: colors.border }]}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.topBarSpacer} />
        )}
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
        onUserPress={handleUserProfilePress}
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
