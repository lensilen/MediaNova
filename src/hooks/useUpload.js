import { useCallback, useState } from "react";

import {
  uploadAudio as uploadAudioFile,
  uploadChunked as uploadChunkedFile,
  uploadImage as uploadImageFile,
  uploadVideo as uploadVideoFile,
} from "../utils/upload";

const initialProgress = {
  bytesTransferred: 0,
  totalBytes: 0,
  progress: 0,
  percent: 0,
  state: "idle",
  phase: "upload",
};

function clampPercent(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(numericValue), 0), 100);
}

function normalizeProgress(nextProgress = {}) {
  const progressValue = Number(nextProgress.progress);
  const safeProgress = Number.isFinite(progressValue)
    ? Math.min(Math.max(progressValue, 0), 1)
    : 0;
  const percent = clampPercent(nextProgress.percent ?? safeProgress * 100);

  return {
    ...nextProgress,
    progress: safeProgress,
    percent: Math.max(Math.min(percent, 100), 0),
    bytesTransferred: Math.max(nextProgress.bytesTransferred || 0, 0),
    totalBytes: Math.max(nextProgress.totalBytes || 0, 0),
  };
}

export function useUpload() {
  const [progress, setProgress] = useState(initialProgress);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const runUpload = useCallback(async (uploadFn, uri, onProgress, options) => {
    setIsUploading(true);
    setError(null);
    setProgress(initialProgress);

    const handleProgress = (nextProgress) => {
      const safeProgress = normalizeProgress(nextProgress);
      setProgress(safeProgress);
      onProgress?.(safeProgress);
    };

    const result = await uploadFn(uri, handleProgress, options);

    if (!result.success) {
      setError(result.error);
    }

    setIsUploading(false);
    return result;
  }, []);

  const uploadImage = useCallback(
    (uri, onProgress, options) =>
      runUpload(uploadImageFile, uri, onProgress, options),
    [runUpload],
  );

  const uploadAudio = useCallback(
    (uri, onProgress, options) =>
      runUpload(uploadAudioFile, uri, onProgress, options),
    [runUpload],
  );

  const uploadVideo = useCallback(
    (uri, onProgress, options) =>
      runUpload(uploadVideoFile, uri, onProgress, options),
    [runUpload],
  );

  const uploadChunked = useCallback(
    (uri, onProgress, options) =>
      runUpload(uploadChunkedFile, uri, onProgress, options),
    [runUpload],
  );

  const resetUpload = useCallback(() => {
    setProgress(initialProgress);
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    error,
    isUploading,
    progress,
    resetUpload,
    uploadAudio,
    uploadChunked,
    uploadImage,
    uploadVideo,
  };
}
