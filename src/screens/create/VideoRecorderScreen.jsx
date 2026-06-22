import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateCameraShell } from "./CreateCameraShell";
import { useCreateDraftStore } from "../../store/createDraftStore";
import { createStyles as styles } from "./createStyles";
import { flashModes, noFilter, noSticker } from "./createOptions";
import { RecorderCameraView } from "./RecorderCameraView";
import { useMediaPermissions } from "./useMediaPermissions";

const audioRecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

export function VideoRecorderScreen({ initialMode = "video" }) {
  const router = useRouter();
  const cameraRef = useRef(null);
  const faceCameraRef = useRef(null);
  const recorderStateRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const recorder = useAudioRecorder(audioRecordingOptions);
  const recorderState = useAudioRecorderState(recorder, 120);
  const setDraft = useCreateDraftStore((state) => state.setDraft);
  const [mode, setMode] = useState(initialMode);
  const [facing, setFacing] = useState("back");
  const [selectedFilter, setSelectedFilter] = useState(noFilter);
  const [selectedSticker, setSelectedSticker] = useState(noSticker);
  const [flashMode, setFlashMode] = useState("off");
  const [pendingMedia, setPendingMedia] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [countdownAction, setCountdownAction] = useState(null);
  const [showColorFilters, setShowColorFilters] = useState(false);
  const [showStickerFilters, setShowStickerFilters] = useState(false);
  const useFaceCamera =
    mode !== "audio" && selectedSticker.key !== noSticker.key;
  const { ensureCameraPermission, ensureVideoPermission } = useMediaPermissions({
    cameraPermission: permission,
    micPermission,
    requestCameraPermission: requestPermission,
    requestMicPermission,
  });

  useEffect(() => {
    recorderStateRef.current = recorderState;
  }, [recorderState]);

  const resetCreateState = useCallback(() => {
    faceCameraRef.current = null;
    setMode(initialMode);
    setFacing("back");
    setSelectedFilter(noFilter);
    setSelectedSticker(noSticker);
    setFlashMode("off");
    setPendingMedia(null);
    setIsRecording(false);
    setVideoPaused(false);
    setRecordSeconds(0);
    setCameraReady(false);
    setTimerSeconds(0);
    setCountdown(0);
    setCountdownAction(null);
    setShowColorFilters(false);
    setShowStickerFilters(false);
  }, [initialMode]);

  const stopActiveMedia = useCallback(() => {
    try {
      cameraRef.current?.stopRecording?.();
    } catch {}

    try {
      faceCameraRef.current?.stopRecording?.();
    } catch {}

    if (recorderStateRef.current?.isRecording) {
      try {
        recorder.stop()?.catch?.(() => {});
      } catch {}
    }

    setAudioModeAsync({ allowsRecording: false }).catch(() => {});
  }, [recorder]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopActiveMedia();
        resetCreateState();
      };
    }, [resetCreateState, stopActiveMedia]),
  );

  const openCapturePreview = useCallback(
    (media) => {
      if (!media?.uri) return;

      const draftId = setDraft({
        filter: selectedFilter.key,
        sticker: selectedSticker.key,
        type: media.type,
        uri: media.uri,
      });

      router.push({
        pathname: "/capture-preview",
        params: {
          draftId,
        },
      });
    },
    [router, selectedFilter.key, selectedSticker.key, setDraft],
  );

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
      const photo = useFaceCamera
        ? await faceCameraRef.current?.takePhoto()
        : await cameraRef.current?.takePictureAsync({ quality: 0.86 });

      if (photo?.uri) {
        const media = { type: "photo", uri: photo.uri };
        setPendingMedia(media);
        openCapturePreview(media);
        Haptics.selectionAsync();
      }
    } catch {
      Alert.alert("Kamera belum siap", "Coba ambil foto sekali lagi.");
    }
  }, [cameraReady, ensureCameraPermission, openCapturePreview, useFaceCamera]);

  const startVideoRecording = useCallback(async () => {
    if (!(await ensureVideoPermission()) || !cameraReady) return;

    try {
      setIsRecording(true);
      setVideoPaused(false);
      setRecordSeconds(0);
      const video = useFaceCamera
        ? await faceCameraRef.current?.startRecording()
        : await cameraRef.current?.recordAsync({ maxDuration: 60 });

      if (video?.uri) {
        const media = { type: "video", uri: video.uri };
        setPendingMedia(media);
        openCapturePreview(media);
      }
    } catch {
      Alert.alert("Rekam video gagal", "Pastikan izin kamera dan mikrofon aktif.");
    } finally {
      setIsRecording(false);
      setVideoPaused(false);
    }
  }, [cameraReady, ensureVideoPermission, openCapturePreview, useFaceCamera]);

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
    if (useFaceCamera) faceCameraRef.current?.stopRecording();
    else cameraRef.current?.stopRecording();
  }

  async function toggleVideoPause() {
    try {
      if (useFaceCamera) {
        const paused = await faceCameraRef.current?.togglePause();
        setVideoPaused(Boolean(paused));
        return;
      }

      await cameraRef.current?.toggleRecordingAsync();
      setVideoPaused((paused) => !paused);
    } catch {
      Alert.alert(
        "Pause video belum didukung",
        "Device ini hanya mendukung stop untuk menyelesaikan video.",
      );
    }
  }

  async function toggleAudioRecording() {
    if (recorderState.isRecording) {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      const nextStatus = recorder.getStatus();
      const audioUri = recorder.uri || nextStatus.url || recorderState.url;

      if (!audioUri) {
        Alert.alert("Audio belum tersimpan", "Coba rekam audio sekali lagi.");
        return;
      }

      const media = { type: "audio", uri: audioUri };
      setPendingMedia(media);
      openCapturePreview(media);
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
      if (recorderState.isRecording) {
        Alert.alert("Audio sedang direkam", "Stop rekaman dulu sebelum memilih file audio.");
        return;
      }

      try {
        const result = await DocumentPicker.getDocumentAsync({
          copyToCacheDirectory: true,
          multiple: false,
          type: ["audio/*"],
        });

        if (result.canceled) {
          return;
        }

        const asset = result.assets?.[0];

        if (!asset?.uri) {
          Alert.alert("Audio tidak terbaca", "Pilih file audio lain dari device.");
          return;
        }

        const media = { name: asset.name || "Audio", type: "audio", uri: asset.uri };
        setPendingMedia(media);
        openCapturePreview(media);
      } catch {
        Alert.alert("Audio gagal dipilih", "Coba pilih file audio lagi.");
      }

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: mode === "photo" ? ["images"] : ["videos"],
      quality: 0.9,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const media = { type: mode, uri: result.assets[0].uri };
      setPendingMedia(media);
      openCapturePreview(media);
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
      setShowColorFilters((visible) => !visible);
      setShowStickerFilters(false);
      return;
    }

    if (toolKey === "sticker") {
      setShowStickerFilters((visible) => !visible);
      setShowColorFilters(false);
    }
  }

  function selectSticker(sticker) {
    setCameraReady(false);
    setSelectedSticker((current) =>
      current.key === sticker.key ? noSticker : sticker,
    );
  }

  function changeMode(nextMode) {
    setCameraReady(false);
    setMode(nextMode);

    if (nextMode === "audio") {
      setShowColorFilters(false);
      setShowStickerFilters(false);
    }
  }

  function flipCamera() {
    setCameraReady(false);
    setFacing((value) => (value === "back" ? "front" : "back"));
  }

  function resetEffects() {
    setSelectedFilter(noFilter);
    setSelectedSticker(noSticker);
    setShowColorFilters(false);
    setShowStickerFilters(false);
  }

  function renderCameraContent() {
    return (
      <RecorderCameraView
        cameraRef={cameraRef}
        facing={facing}
        faceCameraRef={faceCameraRef}
        flashMode={flashMode}
        mode={mode}
        onReady={() => setCameraReady(true)}
        permission={permission}
        recorderState={recorderState}
        requestPermission={requestPermission}
        selectedSticker={selectedSticker}
        useFaceCamera={useFaceCamera}
      />
    );
  }

  const activeRecording = isRecording || recorderState.isRecording;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Media</Text>
        </View>

        <CreateCameraShell
          activeRecording={activeRecording}
          countdown={countdown}
          flashMode={flashMode}
          mode={mode}
          onCapture={handleCapture}
          onFilterSelect={(filter) =>
            setSelectedFilter(selectedFilter.key === filter.key ? noFilter : filter)
          }
          onFlipCamera={flipCamera}
          onLibraryPress={pickFromLibrary}
          onModeChange={changeMode}
          onPauseVideo={toggleVideoPause}
          onResetFilter={resetEffects}
          onStickerSelect={selectSticker}
          onToolPress={handleToolPress}
          pendingMedia={pendingMedia}
          recordSeconds={recordSeconds}
          renderCameraContent={renderCameraContent}
          selectedFilter={selectedFilter}
          selectedSticker={selectedSticker}
          showColorFilters={showColorFilters}
          showStickerFilters={showStickerFilters}
          timerSeconds={timerSeconds}
          videoPaused={videoPaused}
        />
      </View>
    </SafeAreaView>
  );
}
