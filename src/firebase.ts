import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Next.js uses process.env; Vite uses import.meta.env. Read safely so build/SSR never throws.
const env =
  typeof process !== "undefined" && process.env
    ? process.env
    : typeof import.meta !== "undefined" && (import.meta as any).env
      ? (import.meta as any).env
      : ({} as Record<string, string | undefined>);

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY ?? env.VITE_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID ?? env.VITE_FIREBASE_APP_ID,
};

const hasValidConfig =
  !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId &&
    firebaseConfig.storageBucket && firebaseConfig.messagingSenderId && firebaseConfig.appId);

// Use placeholder config when env vars are missing so the app loads (e.g. on Vercel without env set).
// Auth/data will not work until NEXT_PUBLIC_FIREBASE_* are set in Vercel.
const configToUse = hasValidConfig
  ? (firebaseConfig as Record<string, string>)
  : {
      apiKey: "placeholder",
      authDomain: "placeholder.firebaseapp.com",
      projectId: "placeholder",
      storageBucket: "placeholder.appspot.com",
      messagingSenderId: "0",
      appId: "1:0:web:0",
    };

export const firebaseApp = initializeApp(configToUse);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);
export const isFirebaseConfigured = hasValidConfig;