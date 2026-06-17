import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const handleGoogleLogin = async () => {
    console.log("Google login clicked");
    router.replace("/(tabs)"); 
  };

  const handleLogin = async () => {
  const result = await login(email, password);

  if (result.success) {
    router.replace("/(tabs)");
  } else {
    alert(result.error);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediaNova</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#BBAFC8"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
          placeholder="Password"
          placeholderTextColor="#BBAFC8"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          selectionColor="#A855F7"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
      style={styles.googleButton}
      onPress={handleGoogleLogin}
      >
      <Text style={styles.googleButtonText}>
        Login dengan Google
      </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/auth/register")}
      >
        <Text style={styles.link}>
          Belum punya akun? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0F0A14",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 40,
    color: "#FFFFFF",
  },

  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#342242",
    borderRadius: 12,
    backgroundColor: "#1B1224",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  button: {
    minHeight: 54,
    backgroundColor: "#A855F7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },

  link: {
    textAlign: "center",
    color: "#EC4899",
    fontWeight: "700",
  },

  googleButton: {
  minHeight: 54,
  borderWidth: 1,
  borderColor: "#342242",
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#FFFFFF",
  marginBottom: 15,
},

googleButtonText: {
  color: "#000000",
  fontWeight: "700",
},
  
});