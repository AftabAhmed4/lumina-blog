import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// @ts-ignore
import fileConfig from '../firebase-applet-config.json';

// Combine file config with environment fallbacks
const firebaseConfig = {
  apiKey: fileConfig.apiKey || process.env.VITE_FIREBASE_API_KEY,
  authDomain: fileConfig.authDomain || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: fileConfig.projectId || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: fileConfig.storageBucket || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: fileConfig.messagingSenderId || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: fileConfig.appId || process.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: fileConfig.firestoreDatabaseId || process.env.VITE_FIREBASE_DATABASE_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');
export const storage = getStorage(app);

export default app;
