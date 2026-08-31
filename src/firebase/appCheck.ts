import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { firebaseApp } from './config';

export function configureAppCheck(): void {
  const siteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' || !siteKey) return;
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true
  });
}
