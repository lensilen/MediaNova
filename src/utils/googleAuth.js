import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  return Google.useAuthRequest({
    scopes: ["profile", "email"],
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  });
}
