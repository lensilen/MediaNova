import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";

import { colors } from "../../constants/theme";
import { filters, formatTime } from "./createOptions";
import { AudioCapturePanel } from "./AudioCapturePanel";
import { CameraPermissionPanel } from "./CameraPermissionPanel";
import { CreateModeControls } from "./CreateModeControls";
import { CreateToolOverlay } from "./CreateToolOverlay";
import { createStyles as styles } from "./createStyles";

function getNextRoute(type) {
  if (type === "audio") return "/audio-editor";
  if (type === "photo") return "/photo-editor";
  return "/video-editor";
}

export function VideoRecorderScreen({ initialMode = "video" }) {
  const router = useRouter();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [mode, setMode] = useState(initialMode);
  const [facing, setFacing] = useState("back");
  const [selectedFilter, setSelectedFilter] = useState(filters[0]);
  const [pendingMedia, setPendingMedia] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isRecording) return undefined;

    const timer = setInterval(() => {
      setRecordSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  const ensureCameraPermission = useCallback(async () => {
    if (permission?.granted) return true;

    const nextPermission = await requestPermission();
    return nextPermission.granted;
  }, [permission?.granted, requestPermission]);

  const takePhoto = useCallback(async () => {
    if (!(await ensureCameraPermission()) || !cameraReady) return;

    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.86,
      });

      if (photo?.uri) {
        setPendingMedia({ type: "photo", uri: photo.uri });
        Haptics.selectionAsync();
      }
    } catch {
      Alert.alert("Kamera belum siap", "Coba ambil foto sekali lagi.");
    }
  }, [cameraReady, ensureCameraPermission]);

  useEffect(() => {
    if (!countdown) return undefined;

    const timer = setTimeout(() => {
      if (countdown === 1) {
        setCountdown(0);
        takePhoto();
        return;
      }

      setCountdown((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, takePhoto]);

  async function startVideoRecording() {
    if (!(await ensureCameraPermission()) || !cameraReady) return;

    try {
      setIsRecording(true);
      setRecordSeconds(0);
      const video = await cameraRef.current?.recordAsync({ maxDuration: 60 });

      if (video?.uri) {
        setPendingMedia({ type: "video", uri: video.uri });
      }
    } catch {
      Alert.alert("Rekam video gagal", "Pastikan izin kamera dan mikrofon aktif.");
    } finally {
      setIsRecording(false);
    }
  }

  function stopVideoRecording() {
    cameraRef.current?.stopRecording();
  }

  async function toggleAudioRecording() {
    if (recorderState.isRecording) {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      setPendingMedia({
        type: "audio",
        uri: recorder.uri || recorderState.url,
      });
      return;
    }

    const permissionResult = await requestRecordingPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Izin mikrofon dibutuhkan", "Aktifkan mikrofon untuk record audio.");
      return;
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPendingMedia(null);
  }

  async function pickFromLibrary() {
    if (mode === "audio") {
      Alert.alert("Record audio", "Audio dibuat dari mikrofon supaya bisa masuk editor audio.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: mode === "photo" ? ["images"] : ["videos"],
      quality: 0.9,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPendingMedia({ type: mode, uri: result.assets[0].uri });
    }
  }

  function handleCapture() {
    if (mode === "audio") {
      toggleAudioRecording();
      return;
    }

    if (mode === "photo") {
      if (timerSeconds > 0) {
        setCountdown(timerSeconds);
        return;
      }

      takePhoto();
      return;
    }

    if (isRecording) {
      stopVideoRecording();
      return;
    }

    startVideoRecording();
  }

  function handleToolPress(toolKey) {
    if (toolKey === "timer") {
      const values = [0, 3, 5, 10];
      const nextIndex = (values.indexOf(timerSeconds) + 1) % values.length;
      setTimerSeconds(values[nextIndex]);
      return;
    }

    if (toolKey === "filter") {
      const currentIndex = filters.findIndex(
        (filter) => filter.key === selectedFilter.key,
      );
      setSelectedFilter(filters[(currentIndex + 1) % filters.length]);
    }
  }

  function goNext() {
    if (!pendingMedia?.uri) {
      Alert.alert("Media belum ada", "Ambil atau pilih media dulu sebelum lanjut.");
      return;
    }

    router.push({
      pathname: getNextRoute(pendingMedia.type),
      params: {
        filter: selectedFilter.key,
        type: pendingMedia.type,
        uri: pendingMedia.uri,
      },
    });
  }

  function renderCameraContent() {
    if (mode === "audio") {
      return (
        <AudioCapturePanel
          durationMillis={recorderState.durationMillis}
          isRecording={recorderState.isRecording}
        />
      );
    }

    if (!permission?.granted) {
      return <CameraPermissionPanel onRequestPermission={requestPermission} />;
    }

    return (
      <CameraView
        ref={cameraRef}
        facing={facing}
        mode={mode === "photo" ? "picture" : "video"}
        onCameraReady={() => setCameraReady(true)}
        style={styles.camera}
        videoQuality="720p"
      />
    );
  }

  const activeRecording = isRecording || recorderState.isRecording;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="close" size={19} color={colors.text} />
          </Pressable>
          <Text style={styles.subtitle}>Create media</Text>
          <Pressable style={styles.nextButton} onPress={goNext}>
            <Text style={styles.nextText}>Next</Text>
          </Pressable>
        </View>

        <View style={styles.cameraShell}>
          {renderCameraContent()}
          {mode !== "audio" ? (
            <View
              pointerEvents="none"
              style={[styles.filterTint, { backgroundColor: selectedFilter.tint }]}
            />
          ) : null}

          <CreateToolOverlay
            countdown={countdown}
            formattedRecordTime={formatTime(recordSeconds)}
            onFlipCamera={() =>
              setFacing((value) => (value === "back" ? "front" : "back"))
            }
            onToolPress={handleToolPress}
            selectedFilter={selectedFilter}
          />

          <CreateModeControls
            activeRecording={activeRecording}
            mode={mode}
            onCapture={handleCapture}
            onFilterSelect={setSelectedFilter}
            onLibraryPress={pickFromLibrary}
            onModeChange={setMode}
            onResetFilter={() => setSelectedFilter(filters[0])}
            pendingMedia={pendingMedia}
            selectedFilter={selectedFilter}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
