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

export function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
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
    Alert.alert('Keluar dari akun?', 'Kamu perlu login lagi untuk membuka.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: handleLogout },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Kembali</Text>
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
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 48,
    marginBottom: 24,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  backButtonText: {
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
