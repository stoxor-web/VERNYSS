import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check';

import { firebaseApp } from './config';

let initialized = false;

export function configureAppCheck(): void {
  if (initialized) {
    return;
  }

  if (
    import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
  ) {
    return;
  }

  const siteKey =
    import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;

  if (!siteKey) {
    console.error(
      'App Check non initialisé : clé reCAPTCHA Enterprise absente.',
    );
    return;
  }

  try {
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });

    initialized = true;
  } catch (error) {
    console.error(
      'Échec de l’initialisation App Check.',
      error,
    );
  }
}