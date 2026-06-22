import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  return Google.useIdTokenAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    scopes: ["profile", "email"],
    selectAccount: true,
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  });
}
