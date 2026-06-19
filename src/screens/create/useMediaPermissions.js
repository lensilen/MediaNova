import { useCallback } from "react";

export function useMediaPermissions({
  cameraPermission,
  micPermission,
  requestCameraPermission,
  requestMicPermission,
}) {
  const ensureCameraPermission = useCallback(async () => {
    if (cameraPermission?.granted) return true;

    const nextPermission = await requestCameraPermission();
    return nextPermission.granted;
  }, [cameraPermission?.granted, requestCameraPermission]);

  const ensureVideoPermission = useCallback(async () => {
    if (!(await ensureCameraPermission())) return false;
    if (micPermission?.granted) return true;

    const nextMicPermission = await requestMicPermission();
    return nextMicPermission.granted;
  }, [ensureCameraPermission, micPermission?.granted, requestMicPermission]);

  return { ensureCameraPermission, ensureVideoPermission };
}
