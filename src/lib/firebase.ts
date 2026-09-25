import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import configJson from '../../firebase-applet-config.json';

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
export const db: Firestore = rawConfig.firestoreDatabaseId && rawConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, rawConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth: Auth = getAuth(app);

export const isFirebaseConfigured = Boolean(
  configJson.projectId && 
  configJson.apiKey && 
  configJson.apiKey.length > 5
);

export default app;
