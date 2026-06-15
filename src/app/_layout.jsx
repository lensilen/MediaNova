import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const { isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isAuthRoute = segments[0] === 'auth';

    if (!user && !isAuthRoute) {
      router.replace('/auth/login');
      return;
    }

    if (user && isAuthRoute) {
      router.replace('/');
    }
  }, [isLoading, router, segments, user]);

  return (
    <>
      <StatusBar style="auto" />
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
    </>
  );
}
