import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '../constants/theme';
import { OfflineBanner } from '../components/shared/OfflineBanner';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import {
  initializeFcmService,
  setBackgroundFcmMessageHandler,
} from '../utils/fcmService';

setBackgroundFcmMessageHandler();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const firstSegment = segments[0];
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isAuthRoute = firstSegment === "auth";

    if (!isAuthenticated && !isAuthRoute) {
      router.replace("/auth/login");
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      router.replace("/(tabs)");
    }
  }, [firstSegment, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.uid) {
      return undefined;
    }

    let isActive = true;
    let unsubscribe = () => {};

    initializeFcmService(user.uid).then((result) => {
      if (!isActive) {
        result.unsubscribe?.();
        return;
      }

      if (typeof result.unsubscribe === "function") {
        unsubscribe = result.unsubscribe;
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [isAuthenticated, isLoading, user?.uid]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="video-editor" />
        <Stack.Screen name="photo-editor" />
        <Stack.Screen name="capture-preview" />
        <Stack.Screen name="preview" />
        <Stack.Screen name="media-viewer" />
        <Stack.Screen name="audio-editor" />
        <Stack.Screen name="audio-player" />
        <Stack.Screen name="settings" />
      </Stack>
      <OfflineBanner />
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : null}
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

