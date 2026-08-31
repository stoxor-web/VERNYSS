import { getApps, initializeApp } from 'firebase/app';
import {
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
} from 'firebase/firestore';

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `Variable Firebase manquante: ${String(name)}`
    );
  }

  return value;
}

const firebaseConfig = {
  apiKey: required('VITE_FIREBASE_API_KEY'),
  authDomain: required('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: required('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: required('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: required(
    'VITE_FIREBASE_MESSAGING_SENDER_ID'
  ),
  appId: required('VITE_FIREBASE_APP_ID'),
};

export const firebaseApp =
  getApps()[0] ?? initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);

let configured = false;

export async function configureFirebaseClient(): Promise<void> {
  if (configured) {
    return;
  }

  configured = true;

  await setPersistence(
    auth,
    browserSessionPersistence
  );

  if (
    import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
  ) {
    connectAuthEmulator(
      auth,
      'http://127.0.0.1:9099',
      {
        disableWarnings: true,
      }
    );

    connectFirestoreEmulator(
      db,
      '127.0.0.1',
      8080
    );
  }
}