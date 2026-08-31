export type PayrollImportMode = 'manual' | 'csv' | 'pdf-local';

export interface PayrollImportPolicy {
  mode: PayrollImportMode;
  localOnly: boolean;
  externalAiAllowed: boolean;
  notes: string[];
}

export const PAYROLL_IMPORT_POLICIES: Record<PayrollImportMode, PayrollImportPolicy> = {
  manual: {
    mode: 'manual',
    localOnly: true,
    externalAiAllowed: false,
    notes: ['Saisie locale. Aucun bulletin n’est transmis à un tiers.']
  },
  csv: {
    mode: 'csv',
    localOnly: true,
    externalAiAllowed: false,
    notes: ['Le CSV doit être analysé dans le navigateur avant tout enregistrement.']
  },
  'pdf-local': {
    mode: 'pdf-local',
    localOnly: true,
    externalAiAllowed: false,
    notes: ['Le socle ne téléverse pas automatiquement les PDF. Toute analyse distante exige un consentement séparé et explicite.']
  }
};
