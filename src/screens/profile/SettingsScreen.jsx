import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  updateProfile as updateUserProfile,
  uploadProfilePhoto,
} from '../../utils/profile';
import { settingsStyles as styles } from './settingsScreenStyles';

export function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, toggleMode } = useTheme();
  const { profile, setProfile, signOut, user } = useAuth();
  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || '',
  );
  const [bio, setBio] = useState(profile?.bio || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || user?.photoURL || '');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleSave() {
    if (!user?.uid) {
      Alert.alert('Profil gagal disimpan', 'Kamu harus login terlebih dahulu.');
      return;
    }

    setIsSaving(true);
    const result = await updateUserProfile(user.uid, {
      displayName,
      bio,
      photoURL,
    });
    setIsSaving(false);

    if (result.success) {
      setProfile(result.profile);
      Alert.alert('Profil tersimpan', 'Data profil berhasil diperbarui.');
      return;
    }

    Alert.alert('Profil gagal disimpan', result.error || 'Coba lagi.');
  }

  async function handlePickPhoto() {
    if (!user?.uid) {
      Alert.alert('Upload gagal', 'Kamu harus login terlebih dahulu.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Izin galeri dibutuhkan', 'Pilih foto profil dari galeri.');
      return;
    }

    const image = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (image.canceled || !image.assets?.[0]?.uri) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const result = await uploadProfilePhoto(user.uid, image.assets[0].uri, (progress) => {
      setUploadProgress(progress.percent || 0);
    });
    setIsUploading(false);

    if (result.success) {
      setPhotoURL(result.photoURL);
      setProfile(result.profile);
      Alert.alert('Foto tersimpan', 'Foto profil berhasil diperbarui.');
      return;
    }

    Alert.alert('Upload gagal', result.error || 'Coba lagi.');
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
    Alert.alert('Keluar dari akun?', 'Kamu perlu login lagi untuk membuka app.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: handleLogout },
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={styles.iconSpacer} />
      </View>

      <View style={[styles.panel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Pressable
          disabled={isUploading}
          onPress={handlePickPhoto}
          style={styles.photoRow}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={24} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.photoCopy}>
            <Text style={[styles.photoTitle, { color: colors.text }]}>Foto Profil</Text>
            <Text style={[styles.photoText, { color: colors.muted }]}>
              {isUploading ? `Uploading ${uploadProgress}%` : 'Pilih dari galeri'}
            </Text>
          </View>
          {isUploading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Ionicons name="image-outline" size={22} color={colors.secondary} />
          )}
        </Pressable>

        <TextInput
          onChangeText={setDisplayName}
          placeholder="Nama"
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
          ]}
          value={displayName}
        />
        <TextInput
          multiline
          onChangeText={setBio}
          placeholder="Bio"
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            styles.textArea,
            { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
          ]}
          value={bio}
        />

        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: colors.primary }, isSaving && styles.disabled]}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>Simpan Profil</Text>
          )}
        </Pressable>
      </View>

      <View style={[styles.panel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
            <Text style={[styles.settingText, { color: colors.muted }]}>
              Sesuaikan tampilan profil dan settings.
            </Text>
          </View>
          <Switch
            onValueChange={toggleMode}
            value={isDark}
            thumbColor={isDark ? colors.secondary : '#FFFFFF'}
            trackColor={{ false: '#D8CFE4', true: colors.primary }}
          />
        </View>
      </View>

      <Pressable
        disabled={isLoggingOut}
        onPress={confirmLogout}
        style={[styles.logoutButton, isLoggingOut && styles.disabled]}>
        {isLoggingOut ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.logoutText}>Logout</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
