import { CameraView } from "expo-camera";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { StickerOverlay } from "../../components/editor/StickerOverlay";
import { colors } from "../../constants/theme";
import { AudioCapturePanel } from "./AudioCapturePanel";
import { CameraPermissionPanel } from "./CameraPermissionPanel";
import { noSticker } from "./createOptions";
import { createStyles as styles } from "./createStyles";

let NativeFaceFilterCamera = null;

try {
  NativeFaceFilterCamera = require("./FaceFilterCamera").FaceFilterCamera;
} catch {
  NativeFaceFilterCamera = null;
}

export function RecorderCameraView({
  cameraRef,
  facing,
  faceCameraRef,
  flashMode,
  mode,
  onReady,
  permission,
  recorderState,
  requestPermission,
  selectedSticker = noSticker,
  useFaceCamera,
}) {
  const useStaticStickerFallback = useFaceCamera && !NativeFaceFilterCamera;

  useEffect(() => {
    if (!useStaticStickerFallback) {
      return undefined;
    }

    faceCameraRef.current = {
      isStaticStickerFallback: true,
      startRecording: () => cameraRef.current?.recordAsync({ maxDuration: 60 }),
      stopRecording: () => cameraRef.current?.stopRecording(),
      takePhoto: () => cameraRef.current?.takePictureAsync({ quality: 0.86 }),
      togglePause: async () => {
        await cameraRef.current?.toggleRecordingAsync?.();
        return false;
      },
    };

    return () => {
      if (faceCameraRef.current?.isStaticStickerFallback) {
        faceCameraRef.current = null;
      }
    };
  }, [cameraRef, faceCameraRef, useStaticStickerFallback]);

  if (mode === "audio") {
    return (
      <AudioCapturePanel
        durationMillis={recorderState.durationMillis}
        isRecording={recorderState.isRecording}
        metering={recorderState.metering}
      />
    );
  }

  if (!permission?.granted) {
    return <CameraPermissionPanel onRequestPermission={requestPermission} />;
  }

  if (useFaceCamera) {
    if (!NativeFaceFilterCamera) {
      return (
        <View style={styles.camera}>
          <CameraView
            ref={cameraRef}
            enableTorch={mode === "video" && flashMode !== "off"}
            facing={facing}
            flash={flashMode}
            mode={mode === "photo" ? "picture" : "video"}
            onCameraReady={onReady}
            style={styles.camera}
            videoQuality="720p"
          />
          <StickerOverlay compact sticker={selectedSticker} />
          <View pointerEvents="none" style={styles.faceStatus}>
            <View style={[styles.faceStatusDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.faceStatusText}>Tracking aktif di dev build</Text>
          </View>
        </View>
      );
    }

    return (
      <NativeFaceFilterCamera
        active
        facing={facing}
        flashMode={flashMode}
        mode={mode}
        onControlsReady={(controls) => {
          faceCameraRef.current = controls;
        }}
        onReady={onReady}
        selectedSticker={selectedSticker}
      />
    );
  }

  return (
    <CameraView
      ref={cameraRef}
      enableTorch={mode === "video" && flashMode !== "off"}
      facing={facing}
      flash={flashMode}
      mode={mode === "photo" ? "picture" : "video"}
      onCameraReady={onReady}
      style={styles.camera}
      videoQuality="720p"
    />
  );
}
