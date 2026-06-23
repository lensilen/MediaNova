import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { useGoogleAuth } from "../../utils/googleAuth";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function LoginScreen() {
  const router = useRouter();
  const { clearError, error, isAuthenticated, isLoading, login, loginGoogle } = useAuth();
  const [googleRequest, googleResponse, promptGoogleLogin, isGoogleConfigured] =
    useGoogleAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, router]);

  function resetErrors() {
    setFormError("");
    clearError();
  }

  useEffect(() => {
    async function completeGoogleLogin() {
      if (!googleResponse) {
        return;
      }

      if (googleResponse.type === "dismiss" || googleResponse.type === "cancel") {
        setIsGoogleLoading(false);
        return;
      }

      if (googleResponse.type !== "success") {
        setFormError("Login Google gagal. Coba lagi.");
        setIsGoogleLoading(false);
        return;
      }

      const idToken =
        googleResponse.params?.id_token || googleResponse.authentication?.idToken;

      if (!idToken) {
        setFormError("Token Google tidak ditemukan. Coba login ulang.");
        setIsGoogleLoading(false);
        return;
      }

      const result = await loginGoogle(idToken);
      setIsGoogleLoading(false);

      if (result.success) {
        router.replace("/(tabs)");
      }
    }

    completeGoogleLogin();
  }, [googleResponse, loginGoogle, router]);

  async function handleLogin() {
    resetErrors();

    if (!email.trim() || !password) {
      setFormError("Email dan password wajib diisi.");
      return;
    }

    if (!isValidEmail(email)) {
      setFormError("Format email belum benar.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password minimal 6 karakter.");
      return;
    }

    const result = await login(email.trim(), password);

    if (result.success) {
      router.replace("/(tabs)");
    }
  }

  async function handleGoogleLogin() {
    resetErrors();

    if (!isGoogleConfigured) {
      setFormError("Google Login belum dikonfigurasi. Pakai email dulu.");
      return;
    }

    if (!googleRequest) {
      setFormError("Google Login belum siap. Coba lagi sebentar.");
      return;
    }

    setIsGoogleLoading(true);

    try {
      await promptGoogleLogin();
    } catch {
      setIsGoogleLoading(false);
      setFormError("Google Login gagal dibuka. Coba lagi.");
    }
  }

  const message = formError || error;
  const isBusy = isLoading || isGoogleLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <View style={styles.logoMark}>
            <Ionicons name="play" size={28} color={colors.onPrimary} />
          </View>
          <Text style={styles.brand}>MediaNova</Text>
        </View>
        <Text style={styles.title}>Masuk</Text>
        <Text style={styles.subtitle}>Lanjutkan upload dan cek feed multimedia kamu.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="nama@email.com"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              onChangeText={setPassword}
              placeholder="Minimal 6 karakter"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              value={password}
            />
            <Pressable
              onPress={() => setShowPassword((visible) => !visible)}
              style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.muted}
              />
            </Pressable>
          </View>

          {message ? <Text style={styles.error}>{message}</Text> : null}

          <Pressable
            disabled={isBusy}
            onPress={handleLogin}
            style={[styles.button, isBusy && styles.buttonDisabled]}>
            {isLoading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>

          <Pressable
            disabled={isBusy || !isGoogleConfigured || !googleRequest}
            onPress={handleGoogleLogin}
            style={[
              styles.googleButton,
              (isBusy || !isGoogleConfigured || !googleRequest) &&
                styles.buttonDisabled,
            ]}>
            {isGoogleLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <View style={styles.googleContent}>
                <Ionicons name="logo-google" size={18} color={colors.text} />
                <Text style={styles.googleButtonText}>
                  {isGoogleConfigured
                    ? "Sign in dengan Google"
                    : "Google Login belum tersedia"}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/auth/register")}>
          <Text style={styles.link}>Belum punya akun? Daftar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background,
  },
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: 20,
  },
  logoWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  logoMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  brand: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  form: {
    gap: 8,
    marginTop: 4,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordRow: {
    minHeight: 52,
    alignItems: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
    paddingLeft: 16,
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  eyeButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 52,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  googleButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  googleContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  link: {
    color: colors.accent,
    marginTop: 8,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
  },
});
