import { CameraView } from "expo-camera";
import { useEffect } from "react";
import { View } from "react-native";

import { StickerOverlay } from "../../components/editor/StickerOverlay";
import { AudioCapturePanel } from "./AudioCapturePanel";
import { CameraPermissionPanel } from "./CameraPermissionPanel";
import { noSticker } from "./createOptions";
import { createStyles as styles } from "./createStyles";

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
  const useStaticStickerFallback = useFaceCamera;
  const canUseTorch = facing === "back" && mode === "video" && flashMode === "on";
  const safeFlashMode = facing === "back" ? flashMode : "off";

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
    return (
      <View style={styles.camera}>
        <CameraView
          ref={cameraRef}
          enableTorch={canUseTorch}
          facing={facing}
          flash={safeFlashMode}
          mode={mode === "photo" ? "picture" : "video"}
          onCameraReady={onReady}
          style={styles.camera}
          videoQuality="720p"
        />
        <StickerOverlay compact sticker={selectedSticker} />
      </View>
    );
  }

  return (
    <CameraView
      ref={cameraRef}
      enableTorch={canUseTorch}
      facing={facing}
      flash={safeFlashMode}
      mode={mode === "photo" ? "picture" : "video"}
      onCameraReady={onReady}
      style={styles.camera}
      videoQuality="720p"
    />
  );
}
