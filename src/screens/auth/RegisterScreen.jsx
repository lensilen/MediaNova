import { useState } from 'react';
import { router } from 'expo-router';
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

export function RegisterScreen() {
  const { clearError, error, isLoading, registerEmail } = useAuth();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  function resetError() {
    setLocalError('');
    clearError();
  }

  async function handleRegister() {
    resetError();

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setLocalError('Semua field wajib diisi.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Konfirmasi password belum sama.');
      return;
    }

    try {
      await registerEmail(name, email, password);
      router.replace('/');
    } catch {
      // Error sudah disimpan di auth store.
    }
  }

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <Text style={styles.logo}>MediaNova</Text>
        <Text style={styles.title}>Join MediaNova</Text>
        <Text style={styles.subtitle}>
          Connect with fellow student creators and build your portfolio in a
          focused, professional space.
        </Text>

        <View style={styles.formPanel}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            autoComplete="name"
            onChangeText={setName}
            onFocus={resetError}
            placeholder="Your name"
            placeholderTextColor="#A79D97"
            style={styles.input}
            value={name}
          />

          <Text style={styles.label}>University Email</Text>
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

          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            onFocus={resetError}
            placeholder="Minimum 6 characters"
            placeholderTextColor="#A79D97"
            secureTextEntry
            style={styles.input}
            value={password}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setConfirmPassword}
            onFocus={resetError}
            placeholder="Repeat password"
            placeholderTextColor="#A79D97"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
          />

          {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

          <Pressable
            disabled={isLoading}
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isLoading) && styles.pressed,
            ]}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>Create Account</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/auth/login')}>
            <Text style={styles.footerLink}>Log In</Text>
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
  logo: {
    color: '#162D44',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 44,
    textAlign: 'center',
  },
  title: {
    color: '#162D44',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    color: '#5F6973',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 24,
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
    marginTop: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBCFD5',
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    color: '#162D44',
    fontSize: 14,
    minHeight: 42,
    paddingHorizontal: 0,
  },
  error: {
    color: '#B42318',
    fontSize: 12,
    marginTop: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#162D44',
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    marginTop: 22,
  },
  pressed: {
    opacity: 0.78,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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
