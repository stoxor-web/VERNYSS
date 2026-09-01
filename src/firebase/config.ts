import {
  getApps,
  initializeApp,
} from 'firebase/app';

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

function required(
  value: unknown,
  name: string,
): string {
  if (
    typeof value !== 'string' ||
    value.trim() === ''
  ) {
    throw new Error(
      `Variable Firebase manquante: ${name}`,
    );
  }

  return value;
}

const firebaseConfig = {
  apiKey: required(
    import.meta.env
      .VITE_FIREBASE_API_KEY,
    'VITE_FIREBASE_API_KEY',
  ),

  authDomain: required(
    import.meta.env
      .VITE_FIREBASE_AUTH_DOMAIN,
    'VITE_FIREBASE_AUTH_DOMAIN',
  ),

  projectId: required(
    import.meta.env
      .VITE_FIREBASE_PROJECT_ID,
    'VITE_FIREBASE_PROJECT_ID',
  ),

  storageBucket: required(
    import.meta.env
      .VITE_FIREBASE_STORAGE_BUCKET,
    'VITE_FIREBASE_STORAGE_BUCKET',
  ),

  messagingSenderId: required(
    import.meta.env
      .VITE_FIREBASE_MESSAGING_SENDER_ID,
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
  ),

  appId: required(
    import.meta.env
      .VITE_FIREBASE_APP_ID,
    'VITE_FIREBASE_APP_ID',
  ),
};

export const firebaseApp =
  getApps()[0] ??
  initializeApp(
    firebaseConfig,
  );

export const auth =
  getAuth(firebaseApp);

export const db =
  getFirestore(firebaseApp);

let configured = false;

export async function configureFirebaseClient():
  Promise<void> {
  if (configured) {
    return;
  }

  configured = true;

  await setPersistence(
    auth,
    browserSessionPersistence,
  );

  if (
    import.meta.env
      .VITE_USE_FIREBASE_EMULATORS ===
    'true'
  ) {
    connectAuthEmulator(
      auth,
      'http://127.0.0.1:9099',
      {
        disableWarnings: true,
      },
    );

    connectFirestoreEmulator(
      db,
      '127.0.0.1',
      8080,
    );
  }
}