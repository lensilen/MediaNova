import { useFaceDetectorOutput } from "react-native-vision-camera-face-detector";
import {
  Camera,
  useCameraDevice,
  usePhotoOutput,
  useVideoOutput,
} from "react-native-vision-camera";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { noSticker } from "./createOptions";
import { FaceFilterOverlay } from "./FaceFilterOverlay";
import { createStyles as styles } from "./createStyles";

function toFileUri(path) {
  if (!path) return "";
  return path.startsWith("file://") ? path : `file://${path}`;
}

function cloneFace(face) {
  if (!face?.bounds) return null;

  return {
    bounds: {
      height: face.bounds.height,
      width: face.bounds.width,
      x: face.bounds.x,
      y: face.bounds.y,
    },
    rollAngle: face.rollAngle || 0,
  };
}

function mixNumber(current, next, amount = 0.38) {
  return current + (next - current) * amount;
}

function smoothFace(currentFace, nextFace) {
  if (!nextFace) return null;
  if (!currentFace) return nextFace;

  return {
    bounds: {
      height: mixNumber(currentFace.bounds.height, nextFace.bounds.height),
      width: mixNumber(currentFace.bounds.width, nextFace.bounds.width),
      x: mixNumber(currentFace.bounds.x, nextFace.bounds.x),
      y: mixNumber(currentFace.bounds.y, nextFace.bounds.y),
    },
    rollAngle: mixNumber(currentFace.rollAngle || 0, nextFace.rollAngle || 0),
  };
}

export function FaceFilterCamera({
  active,
  facing,
  flashMode,
  mode,
  onControlsReady,
  onReady,
  selectedSticker = noSticker,
}) {
  const recorderRef = useRef(null);
  const [layout, setLayout] = useState({ height: 1, width: 1 });
  const [face, setFace] = useState(null);
  const device = useCameraDevice(facing);
  const photoOutput = usePhotoOutput({ quality: 0.86 });
  const videoOutput = useVideoOutput({ enableAudio: true });
  const faceOutput = useFaceDetectorOutput({
    autoMode: true,
    cameraFacing: facing,
    minFaceSize: 0.15,
    onError: () => setFace(null),
    onFacesDetected: (faces) => {
      const nextFace = cloneFace(faces?.[0]);
      setFace((currentFace) => smoothFace(currentFace, nextFace));
    },
    outputResolution: "preview",
    performanceMode: "fast",
    runLandmarks: true,
    trackingEnabled: true,
    windowHeight: layout.height,
    windowWidth: layout.width,
  });
  const outputs = useMemo(
    () => [photoOutput, videoOutput, faceOutput],
    [faceOutput, photoOutput, videoOutput],
  );

  const takePhoto = useCallback(async () => {
    const file = await photoOutput.capturePhotoToFile(
      { enableShutterSound: true, flashMode },
      {},
    );
    return { uri: toFileUri(file?.filePath) };
  }, [flashMode, photoOutput]);

  const startRecording = useCallback(async () => {
    const recorder = await videoOutput.createRecorder({ maxDuration: 60 });
    recorderRef.current = recorder;

    return new Promise((resolve, reject) => {
      recorder
        .startRecording(
          (filePath) => {
            recorderRef.current = null;
            resolve({ uri: toFileUri(filePath) });
          },
          (error) => {
            recorderRef.current = null;
            reject(error);
          },
        )
        .catch(reject);
    });
  }, [videoOutput]);

  const stopRecording = useCallback(async () => {
    await recorderRef.current?.stopRecording();
  }, []);

  const togglePause = useCallback(async () => {
    const recorder = recorderRef.current;

    if (!recorder) return false;
    if (recorder.isPaused) {
      await recorder.resumeRecording();
      return false;
    }

    await recorder.pauseRecording();
    return true;
  }, []);

  useEffect(() => {
    onControlsReady?.({ startRecording, stopRecording, takePhoto, togglePause });
  }, [onControlsReady, startRecording, stopRecording, takePhoto, togglePause]);

  if (!device) {
    return (
      <View style={styles.cameraFallback}>
        <Text style={styles.fallbackTitle}>Kamera belum tersedia</Text>
        <Text style={styles.fallbackText}>
          Coba ganti kamera atau buka dari device yang punya kamera aktif.
        </Text>
      </View>
    );
  }

  return (
    <View
      onLayout={(event) => setLayout(event.nativeEvent.layout)}
      style={styles.camera}
    >
      <Camera
        device={device}
        isActive={active}
        mirrorMode={facing === "front" ? "on" : "off"}
        onPreviewStarted={onReady}
        outputs={outputs}
        resizeMode="cover"
        style={styles.camera}
        torchMode={mode === "video" && flashMode !== "off" ? "on" : "off"}
      />
      <FaceFilterOverlay face={face} selectedSticker={selectedSticker} />
      {selectedSticker.key !== noSticker.key ? (
        <View pointerEvents="none" style={styles.faceStatus}>
          <View style={[styles.faceStatusDot, { backgroundColor: face ? colors.secondary : colors.danger }]} />
          <Text style={styles.faceStatusText}>
            {face ? selectedSticker.label : "Cari wajah"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
