import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
    </>
  );
}
