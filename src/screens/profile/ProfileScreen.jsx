import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { colors } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

export function ProfileScreen() {
  const router = useRouter();
  const { error, profile, signOut, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    const result = await signOut();
    setIsLoggingOut(false);

    if (result.success) {
      router.replace('/auth/login');
      return;
    }

    Alert.alert('Logout gagal', result.error || 'Coba lagi.');
  }

  function confirmLogout() {
    Alert.alert('Keluar dari akun?', 'Kamu perlu login lagi untuk membuka feed.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: handleLogout },
    ]);
  }

  const displayName = profile?.displayName || user?.displayName || 'User';
  const email = profile?.email || user?.email || '-';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Post</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.followers ?? 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.following ?? 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.secondaryButton} onPress={() => router.push('/settings')}>
        <Text style={styles.secondaryButtonText}>Settings</Text>
      </Pressable>

      <Pressable
        disabled={isLoggingOut}
        onPress={confirmLogout}
        style={[styles.logoutButton, isLoggingOut && styles.disabledButton]}>
        {isLoggingOut ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.logoutButtonText}>Logout</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 28,
  },
  avatar: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 44,
    backgroundColor: colors.primary,
    marginBottom: 14,
  },
  avatarText: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  email: {
    color: colors.muted,
    marginTop: 6,
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 12,
  },
  error: {
    color: '#FCA5A5',
    marginBottom: 12,
    textAlign: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: '#E11D48',
  },
  logoutButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
