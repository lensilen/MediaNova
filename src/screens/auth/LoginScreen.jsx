import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export function LoginScreen() {
  return (
    <View>
      <Text>LoginScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  card: {
    gap: 14,
  },
  brand: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
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
    color: '#FCA5A5',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  googleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    color: colors.secondary,
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
});