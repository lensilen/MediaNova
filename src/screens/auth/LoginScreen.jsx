import { useEffect, useMemo, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const { clearError, error, isLoading, loginEmail, loginGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const googleClientIds = useMemo(
    () => ({
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
    }),
    []
  );

  const hasGoogleClientId = Object.values(googleClientIds).some(Boolean);
  const [request, response, promptAsync] = Google.useAuthRequest(googleClientIds);

  useEffect(() => {
    if (response?.type !== 'success') {
      return;
    }

    const tokens = {
      accessToken: response.authentication?.accessToken,
      idToken: response.params?.id_token,
    };

    loginGoogle(tokens)
      .then(() => router.replace('/'))
      .catch(() => {});
  }, [loginGoogle, response]);

  function resetError() {
    setLocalError('');
    clearError();
  }

  async function handleLogin() {
    resetError();

    if (!email.trim() || !password) {
      setLocalError('Email dan password wajib diisi.');
      return;
    }

    try {
      await loginEmail(email, password);
      router.replace('/');
    } catch {
      // Error sudah disimpan di auth store.
    }
  }

  function handleGoogleLogin() {
    resetError();

    if (!hasGoogleClientId) {
      setLocalError('Google Client ID belum diisi di .env.');
      return;
    }

    promptAsync();
  }

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <View style={styles.brandMark}>
          <Text style={styles.brandIcon}>{'>'}</Text>
        </View>

        <Text style={styles.title}>MediaNova</Text>
        <Text style={styles.subtitle}>Welcome back</Text>

        <View style={styles.formPanel}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            onFocus={resetError}
            placeholder="name@example.com"
            placeholderTextColor="#A79D97"
            style={styles.input}
            value={email}
          />

          <View style={styles.rowLabel}>
            <Text style={styles.label}>Password</Text>
            <Pressable onPress={() => setShowPassword((value) => !value)}>
              <Text style={styles.forgotText}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          </View>
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            onFocus={resetError}
            placeholder="********"
            placeholderTextColor="#A79D97"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
          />

          {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

          <Pressable
            disabled={isLoading}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isLoading) && styles.pressed,
            ]}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>Login</Text>
            )}
          </Pressable>

          <Pressable
            disabled={isLoading || (hasGoogleClientId && !request)}
            onPress={handleGoogleLogin}
            style={({ pressed }) => [
              styles.googleButton,
              (pressed || isLoading) && styles.googlePressed,
            ]}>
            <Text style={styles.googleText}>G</Text>
            <Text style={styles.googleLabel}>Sign in with Google</Text>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Do not have an account? </Text>
          <Pressable onPress={() => router.push('/auth/register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF6F2',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandMark: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#162D44',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
    width: 56,
  },
  brandIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  title: {
    color: '#182D44',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#5F6973',
    fontSize: 14,
    marginBottom: 26,
    marginTop: 6,
    textAlign: 'center',
  },
  formPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE5DE',
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
  },
  label: {
    color: '#162D44',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  rowLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  forgotText: {
    color: '#162D44',
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F7F0EC',
    borderColor: '#E8DDD6',
    borderRadius: 6,
    borderWidth: 1,
    color: '#162D44',
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  error: {
    color: '#B42318',
    fontSize: 12,
    marginTop: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#162D44',
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
  },
  googleButton: {
    alignItems: 'center',
    borderColor: '#D8CCC4',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 46,
    justifyContent: 'center',
    marginTop: 12,
  },
  googlePressed: {
    backgroundColor: '#F8F1EC',
  },
  googleText: {
    color: '#162D44',
    fontSize: 16,
    fontWeight: '900',
  },
  googleLabel: {
    color: '#162D44',
    fontSize: 13,
    fontWeight: '700',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6F7479',
    fontSize: 13,
  },
  footerLink: {
    color: '#162D44',
    fontSize: 13,
    fontWeight: '800',
  },
});
