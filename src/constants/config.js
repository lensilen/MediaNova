export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const requiredFirebaseConfigKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

export function getMissingFirebaseConfigKeys(config = firebaseConfig) {
  return requiredFirebaseConfigKeys.filter((key) => !config[key]);
}

export function assertFirebaseConfig(config = firebaseConfig) {
  const missingKeys = getMissingFirebaseConfigKeys(config);

  if (missingKeys.length > 0) {
    throw new Error(
      `Konfigurasi Firebase belum lengkap. Cek .env untuk: ${missingKeys.join(
        ", "
      )}`
    );
  }
}
