import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { colors } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile as updateUserProfile } from '../../utils/profile';

export function SettingsScreen() {
  const router = useRouter();
  const { profile, setProfile, signOut, user } = useAuth();
  const initialDisplayName = profile?.displayName || user?.displayName || '';
  const initialBio = profile?.bio || '';
  const initialPhotoURL = profile?.photoURL || user?.photoURL || '';

  return (
    <SettingsForm
      key={`${user?.uid || 'guest'}-${initialDisplayName}-${initialBio}-${initialPhotoURL}`}
      initialBio={initialBio}
      initialDisplayName={initialDisplayName}
      initialPhotoURL={initialPhotoURL}
      onProfileSaved={setProfile}
      router={router}
      signOut={signOut}
      userId={user?.uid}
    />
  );
}

function SettingsForm({
  initialBio,
  initialDisplayName,
  initialPhotoURL,
  onProfileSaved,
  router,
  signOut,
  userId,
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [photoURL, setPhotoURL] = useState(initialPhotoURL);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleSave() {
    if (!userId) {
      Alert.alert('Profil gagal disimpan', 'Kamu harus login terlebih dahulu.');
      return;
    }

    setIsSaving(true);
    const result = await updateUserProfile(userId, {
      displayName,
      bio,
      photoURL,
    });
    setIsSaving(false);

    if (result.success) {
      onProfileSaved(result.profile);
      Alert.alert('Profil tersimpan', 'Data profil berhasil diperbarui.');
      return;
    }

    Alert.alert('Profil gagal disimpan', result.error || 'Coba lagi.');
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    const result = await signOut();
    setIsLoggingOut(false);

    if (result.success) {
      router.replace('/auth/login');
      return;
    }

    Alert.alert('Logout gagal', result.error || 'Coba lagi.');
  }

  function confirmLogout() {
    Alert.alert('Keluar dari akun?', 'Kamu perlu login lagi untuk membuka.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: handleLogout },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.form}>
        <TextInput
          onChangeText={setDisplayName}
          placeholder="Nama"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={displayName}
        />
        <TextInput
          multiline
          onChangeText={setBio}
          placeholder="Bio"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.textArea]}
          value={bio}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={setPhotoURL}
          placeholder="Photo URL"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={photoURL}
        />

        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.saveButton, isSaving && styles.disabledButton]}>
          {isSaving ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.saveButtonText}>Simpan Profil</Text>
          )}
        </Pressable>
      </View>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Kembali</Text>
      </Pressable>

      <Pressable
        disabled={isLoggingOut}
        onPress={confirmLogout}
        style={[styles.logoutButton, isLoggingOut && styles.disabledButton]}>
        {isLoggingOut ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.logoutButtonText}>Logout</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 48,
    marginBottom: 24,
  },
  form: {
    gap: 12,
    marginBottom: 16,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: '#E11D48',
  },
  logoutButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
