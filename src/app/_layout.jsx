import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const firstSegment = segments[0];
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isAuthRoute = firstSegment === 'auth';

    if (!isAuthenticated && !isAuthRoute) {
      router.replace('/auth/login');
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      router.replace('/');
    }
  }, [firstSegment, isAuthenticated, isLoading, router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="video-editor" />
        <Stack.Screen name="photo-editor" />
        <Stack.Screen name="preview" />
        <Stack.Screen name="audio-player" />
        <Stack.Screen name="settings" />
      </Stack>
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
