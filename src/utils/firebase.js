import { initializeApp, getApps } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { assertFirebaseConfig, firebaseConfig } from "../constants/config";
import asyncStorage from "@react-native-async-storage/async-storage";

assertFirebaseConfig();

export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let firebaseAuth;

try {
  firebaseAuth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  if (error?.code !== "auth/already-initialized") {
    throw error;
  }

  firebaseAuth = getAuth(firebaseApp);
}

export const auth = firebaseAuth;
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
