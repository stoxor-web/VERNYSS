import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface PrivacySettings {
  hideAmountsByDefault: boolean;
  allowExternalAi: boolean;
  optionalAnalytics: boolean;
  personalizedNews: boolean;
  historyRetentionMonths: number | null;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  hideAmountsByDefault: true,
  allowExternalAi: false,
  optionalAnalytics: false,
  personalizedNews: true,
  historyRetentionMonths: null
};

export async function loadPrivacySettings(uid: string): Promise<PrivacySettings> {
  const snapshot = await getDoc(doc(db, 'users', uid, 'privacySettings', 'default'));
  if (!snapshot.exists()) return DEFAULT_PRIVACY_SETTINGS;
  const data = snapshot.data();
  return {
    hideAmountsByDefault: data['hideAmountsByDefault'] === true,
    allowExternalAi: data['allowExternalAi'] === true,
    optionalAnalytics: data['optionalAnalytics'] === true,
    personalizedNews: data['personalizedNews'] !== false,
    historyRetentionMonths: typeof data['historyRetentionMonths'] === 'number' ? data['historyRetentionMonths'] : null
  };
}

export async function savePrivacySettings(uid: string, settings: PrivacySettings): Promise<void> {
  const reference = doc(db, 'users', uid, 'privacySettings', 'default');
  const existing = await getDoc(reference);
  if (existing.exists()) {
    await setDoc(reference, { ...settings, updatedAt: serverTimestamp() }, { merge: true });
  } else {
    await setDoc(reference, { ...settings, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), schemaVersion: 1 });
  }
}
