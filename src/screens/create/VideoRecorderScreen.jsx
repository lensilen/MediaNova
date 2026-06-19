import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, SafeAreaView, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { flashModes, noFilter } from "./createOptions";
import { AudioCapturePanel } from "./AudioCapturePanel";
import { CameraPermissionPanel } from "./CameraPermissionPanel";
import { CreateCameraShell } from "./CreateCameraShell";
import { createStyles as styles } from "./createStyles";
import { useMediaPermissions } from "./useMediaPermissions";

const getNextRoute = (type) => type === "audio" ? "/audio-editor" : type === "photo" ? "/photo-editor" : "/video-editor";

export function VideoRecorderScreen({ initialMode = "video" }) {
  const router = useRouter();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [mode, setMode] = useState(initialMode);
  const [facing, setFacing] = useState("back");
  const [selectedFilter, setSelectedFilter] = useState(noFilter);
  const [flashMode, setFlashMode] = useState("off");
  const [pendingMedia, setPendingMedia] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [countdownAction, setCountdownAction] = useState(null), [showFilters, setShowFilters] = useState(false);
  const { ensureCameraPermission, ensureVideoPermission } = useMediaPermissions({
    cameraPermission: permission,
    micPermission,
    requestCameraPermission: requestPermission,
    requestMicPermission,
  });

  useEffect(() => {
    if (!isRecording || videoPaused) return undefined;

    const timer = setInterval(() => {
      setRecordSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording, videoPaused]);

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

  const startVideoRecording = useCallback(async () => {
    if (!(await ensureVideoPermission()) || !cameraReady) return;

    try {
      setIsRecording(true);
      setVideoPaused(false);
      setRecordSeconds(0);
      const video = await cameraRef.current?.recordAsync({ maxDuration: 60 });

      if (video?.uri) {
        setPendingMedia({ type: "video", uri: video.uri });
      }
    } catch {
      Alert.alert("Rekam video gagal", "Pastikan izin kamera dan mikrofon aktif.");
    } finally {
      setIsRecording(false);
      setVideoPaused(false);
    }
  }, [cameraReady, ensureVideoPermission]);

  useEffect(() => {
    if (!countdown) return undefined;

    const timer = setTimeout(() => {
      if (countdown === 1) {
        setCountdown(0);
        if (countdownAction === "video") {
          startVideoRecording();
        } else {
          takePhoto();
        }
        setCountdownAction(null);
        return;
      }

      setCountdown((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, countdownAction, startVideoRecording, takePhoto]);

  function stopVideoRecording() {
    cameraRef.current?.stopRecording();
  }

  async function toggleVideoPause() {
    try {
      await cameraRef.current?.toggleRecordingAsync();
      setVideoPaused((paused) => !paused);
    } catch {
      Alert.alert("Pause video belum didukung", "Device ini hanya mendukung stop untuk menyelesaikan video.");
    }
  }

  async function toggleAudioRecording() {
    if (recorderState.isRecording) {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      setPendingMedia({ type: "audio", uri: recorder.uri || recorderState.url });
      return;
    }

    const permissionResult = await requestRecordingPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Izin mikrofon dibutuhkan", "Aktifkan mikrofon untuk record audio.");
      return;
    }

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
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
    if (countdown > 0) {
      setCountdown(0);
      setCountdownAction(null);
      return;
    }

    if (mode === "audio") {
      toggleAudioRecording();
      return;
    }

    if (mode === "photo") {
      if (timerSeconds > 0) {
        setCountdownAction("photo");
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

    if (timerSeconds > 0) {
      setCountdownAction("video");
      setCountdown(timerSeconds);
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

    if (toolKey === "flash") {
      const nextIndex = (flashModes.indexOf(flashMode) + 1) % flashModes.length;
      setFlashMode(flashModes[nextIndex]);
      return;
    }

    if (toolKey === "filter") {
      setShowFilters((visible) => !visible);
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
          durationMillis={recorderState.durationMillis} isRecording={recorderState.isRecording}
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
        enableTorch={mode === "video" && flashMode !== "off"}
        flash={flashMode}
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

        <CreateCameraShell
          activeRecording={activeRecording} countdown={countdown}
          flashMode={flashMode} mode={mode}
          onCapture={handleCapture}
          onFilterSelect={(filter) => setSelectedFilter(selectedFilter.key === filter.key ? noFilter : filter)}
          onFlipCamera={() => setFacing((value) => (value === "back" ? "front" : "back"))}
          onLibraryPress={pickFromLibrary}
          onModeChange={setMode}
          onPauseVideo={toggleVideoPause}
          onResetFilter={() => setSelectedFilter(noFilter)}
          onToolPress={handleToolPress}
          pendingMedia={pendingMedia}
          recordSeconds={recordSeconds}
          renderCameraContent={renderCameraContent}
          selectedFilter={selectedFilter} showFilters={showFilters}
          timerSeconds={timerSeconds} videoPaused={videoPaused}
        />
      </View>
    </SafeAreaView>
  );
}
