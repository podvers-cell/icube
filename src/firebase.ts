import type { FirebaseApp } from "firebase/app";
import { initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getAuth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

const hasAllVars =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.storageBucket &&
  !!firebaseConfig.messagingSenderId &&
  !!firebaseConfig.appId;

/** True when all NEXT_PUBLIC_FIREBASE_* env vars are set. When false, auth/firestore are null and calls will throw a clear error. */
export const isFirebaseConfigured = hasAllVars;

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestore: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

if (hasAllVars) {
  firebaseApp = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  firebaseStorage = getStorage(firebaseApp);
}

function requireAuth(): Auth {
  if (!firebaseAuth) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* in .env.local or your hosting environment. See .env.example.");
  return firebaseAuth;
}
function requireFirestore(): Firestore {
  if (!firestore) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* in .env.local or your hosting environment. See .env.example.");
  return firestore;
}
function requireStorage(): FirebaseStorage {
  if (!firebaseStorage) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* in .env.local or your hosting environment. See .env.example.");
  return firebaseStorage;
}

export { firebaseApp, firebaseAuth, firestore, firebaseStorage };
export { requireAuth, requireFirestore, requireStorage };