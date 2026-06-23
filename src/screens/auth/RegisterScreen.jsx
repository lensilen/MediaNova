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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isStrongEnoughPassword(value) {
  return value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value);
}

export default function RegisterScreen() {
  const router = useRouter();
  const { clearError, error, isAuthenticated, isLoading, register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (!isValidEmail(email)) {
      setFormError("Format email belum benar.");
      return;
    }

    if (!isStrongEnoughPassword(password)) {
      setFormError("Password minimal 8 karakter dan harus berisi huruf serta angka.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Konfirmasi password tidak sama.");
      return;
    }

    const result = await register(email.trim(), password, displayName.trim());

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
        <View style={styles.logoWrap}>
          <View style={styles.logoMark}>
            <Ionicons name="sparkles" size={24} color={colors.onPrimary} />
          </View>
          <Text style={styles.brand}>MediaNova</Text>
        </View>
        <Text style={styles.title}>Buat akun</Text>
        <Text style={styles.subtitle}>
          Daftar untuk mulai upload video, audio, dan foto.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nama</Text>
          <TextInput
            autoCapitalize="words"
            onChangeText={setDisplayName}
            placeholder="Nama profil"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={displayName}
          />
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
              placeholder="Huruf dan angka, min. 8"
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
          <Text style={styles.hint}>Minimal 8 karakter dengan huruf dan angka.</Text>
          <Text style={styles.label}>Konfirmasi Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              onChangeText={setConfirmPassword}
              placeholder="Ulangi password"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showConfirmPassword}
              style={styles.passwordInput}
              value={confirmPassword}
            />
            <Pressable
              onPress={() => setShowConfirmPassword((visible) => !visible)}
              style={styles.eyeButton}>
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.muted}
              />
            </Pressable>
          </View>

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
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
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
