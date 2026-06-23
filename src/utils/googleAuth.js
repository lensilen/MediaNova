import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

function hasGoogleClientId() {
  return Boolean(
    process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID &&
      process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  );
}

export function useGoogleAuth() {
  const isConfigured = hasGoogleClientId();
  const result = Google.useIdTokenAuthRequest({
    androidClientId:
      process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID || "missing-client-id",
    scopes: ["profile", "email"],
    selectAccount: true,
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID || "missing-client-id",
  });

  return [...result, isConfigured];
}
