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
import { useRouter } from "expo-router";

import { colors } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterScreen() {
  const router = useRouter();
  const { clearError, error, isAuthenticated, isLoading, register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  function resetErrors() {
    setFormError("");
    clearError();
  }

  async function handleRegister() {
    resetErrors();

    if (!displayName.trim() || !email.trim() || !password) {
      setFormError("Nama, email, dan password wajib diisi.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Konfirmasi password tidak sama.");
      return;
    }

    const result = await register(email, password, displayName);

    if (result.success) {
      router.replace("/");
    }
  }

  const message = formError || error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.brand}>MediaNova</Text>
        <Text style={styles.title}>Buat akun</Text>
        <Text style={styles.subtitle}>
          Daftar untuk mulai upload video, audio, dan foto.
        </Text>

        <View style={styles.form}>
          <TextInput
            autoCapitalize="words"
            onChangeText={setDisplayName}
            placeholder="Nama"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={displayName}
          />
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          <TextInput
            onChangeText={setConfirmPassword}
            placeholder="Konfirmasi password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
          />

          {message ? <Text style={styles.error}>{message}</Text> : null}

          <Pressable
            disabled={isLoading}
            onPress={handleRegister}
            style={[styles.button, isLoading && styles.buttonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Daftar</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/auth/login")}>
          <Text style={styles.link}>Sudah punya akun? Masuk</Text>
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
    gap: 14,
  },
  brand: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  form: {
    gap: 12,
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
  error: {
    color: "#FCA5A5",
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  link: {
    color: colors.secondary,
    marginTop: 8,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
});
