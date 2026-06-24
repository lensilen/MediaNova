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
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [commentFollowers, setCommentFollowers] = useState(true);
  const [hideLikes, setHideLikes] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

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
      mediaTypes: ['images'],
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

      <SettingsSection colors={colors} title="ACCOUNT VISIBILITY">
        <SettingRow
          colors={colors}
          description="When private, only followers you approve can see what you share."
          title="Private Account">
          <Switch
            onValueChange={setPrivateAccount}
            value={privateAccount}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.border, true: colors.text }}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection colors={colors} title="INTERACTIONS">
        <SettingRow
          colors={colors}
          description="Control who can comment on your high-resolution media."
          title="Comment Permissions">
          <Pressable onPress={() => setCommentFollowers((value) => !value)}>
            <Text style={[styles.menuValue, { color: colors.text }]}>
              {commentFollowers ? 'Followers' : 'Everyone'}
            </Text>
          </Pressable>
        </SettingRow>
        <SettingRow
          colors={colors}
          description="Hide the number of likes on your posts to focus on content."
          title="Like Visibility">
          <Switch
            onValueChange={setHideLikes}
            value={hideLikes}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.border, true: colors.text }}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection colors={colors} title="PROFILE">
        <Pressable
          onPress={() => setShowEditProfile((value) => !value)}
          style={styles.linkRow}>
          <Text style={[styles.linkText, { color: colors.text }]}>Edit Profile</Text>
          <Ionicons
            name={showEditProfile ? 'chevron-up' : 'chevron-forward'}
            size={18}
            color={colors.muted}
          />
        </Pressable>

        {showEditProfile ? (
          <View style={[styles.editPanel, { borderTopColor: colors.border }]}>
            <Pressable
              disabled={isUploading}
              onPress={handlePickPhoto}
              style={styles.photoRow}>
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.text }]}>
                  <Ionicons name="camera" size={22} color={colors.surface} />
                </View>
              )}
              <View style={styles.photoCopy}>
                <Text style={[styles.photoTitle, { color: colors.text }]}>Foto Profil</Text>
                <Text style={[styles.photoText, { color: colors.muted }]}>
                  {isUploading ? `Uploading ${uploadProgress}%` : 'Pilih dari galeri'}
                </Text>
              </View>
            </Pressable>

            <TextInput
              onChangeText={setDisplayName}
              placeholder="Nama"
              placeholderTextColor={colors.muted}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={displayName}
            />
            <TextInput
              multiline
              onChangeText={setBio}
              placeholder="Bio"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text }]}
              value={bio}
            />

            <Pressable
              disabled={isSaving}
              onPress={handleSave}
              style={[styles.saveButton, { backgroundColor: colors.text }, isSaving && styles.disabled]}>
              {isSaving ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={[styles.saveText, { color: colors.surface }]}>Simpan Profil</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </SettingsSection>

      <SettingsSection colors={colors} title="DATA & HISTORY">
        <SettingRow colors={colors} description="Get a copy of your content and activity." title="Download Your Data">
          <Ionicons name="download-outline" size={20} color={colors.muted} />
        </SettingRow>
        <SettingRow colors={colors} description="Keep saved content ready when connection drops." title="Offline Mode">
          <Switch
            onValueChange={setOfflineMode}
            value={offlineMode}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.border, true: colors.text }}
          />
        </SettingRow>
        <SettingRow colors={colors} description="Switch between the UI/UX light mode and dark mode." title="Theme">
          <Switch
            onValueChange={toggleMode}
            value={isDark}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.border, true: colors.text }}
          />
        </SettingRow>
      </SettingsSection>

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

function SettingsSection({ children, colors, title }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>{title}</Text>
      <View style={[styles.panel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        {children}
      </View>
    </View>
  );
}

function SettingRow({ children, colors, description, title }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingText, { color: colors.muted }]}>{description}</Text>
      </View>
      {children}
    </View>
  );
}
