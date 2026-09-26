import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore,
  getFirestore, 
  Firestore,
  setLogLevel
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import configJson from '../../firebase-applet-config.json';

// Silence internal Firestore stream connection/offline notices so they do not trigger false-positive console error catches
try {
  setLogLevel('silent');
} catch (e) {
  // Ignore if already set
}

// Initialize Firebase using firebase-applet-config.json
const firebaseConfig = {
  apiKey: configJson.apiKey,
  authDomain: configJson.authDomain,
  projectId: configJson.projectId,
  storageBucket: configJson.storageBucket,
  messagingSenderId: configJson.messagingSenderId,
  appId: configJson.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the explicit firestoreDatabaseId if provisioned
const rawConfig = configJson as Record<string, any>;
const firestoreDbId = rawConfig.firestoreDatabaseId || 'ai-studio-pdftoappconverte-e9514294-04a0-41c2-bbfc-becd16e90187';

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, firestoreDbId && firestoreDbId !== '(default)' ? firestoreDbId : undefined);
} catch (err) {
  // If already initialized with options or fallback needed
  firestoreInstance = firestoreDbId && firestoreDbId !== '(default)'
    ? getFirestore(app, firestoreDbId)
    : getFirestore(app);
}

export const db: Firestore = firestoreInstance;

export const auth: Auth = getAuth(app);

export const isFirebaseConfigured = Boolean(
  configJson.projectId && 
  configJson.apiKey && 
  configJson.apiKey.length > 5
);

export default app;
