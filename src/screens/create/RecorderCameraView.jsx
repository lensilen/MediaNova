import { CameraView } from "expo-camera";
import { Text, View } from "react-native";

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
        <View style={styles.cameraFallback}>
          <Text style={styles.fallbackTitle}>Sticker butuh dev build</Text>
          <Text style={styles.fallbackText}>
            Face detection aktif setelah aplikasi dibuild lewat EAS.
          </Text>
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
