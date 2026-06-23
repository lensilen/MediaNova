function normalizeUri(uri) {
  return typeof uri === "string" ? uri.trim() : "";
}

function waitForPreview() {
  return new Promise((resolve) => {
    setTimeout(resolve, 180);
  });
}

async function passThroughMedia(uri) {
  const cleanUri = normalizeUri(uri);

  if (!cleanUri) {
    throw new Error("URI media wajib diisi.");
  }

  await waitForPreview();
  return cleanUri;
}

export async function processAudioEdit(uri) {
  return passThroughMedia(uri);
}

export async function processVideoEdit(uri) {
  return passThroughMedia(uri);
}
