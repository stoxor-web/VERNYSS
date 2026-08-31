export interface BonusOccurrence {
  name: string;
  expectedAmount: number;
  actualAmount: number;
  recurring: boolean;
}

export interface SalaryAnomaly {
  type: 'missingBonus' | 'lowBonus' | 'doubleBonus' | 'unexpectedBonus';
  label: string;
  reason: string;
}

export function detectBonusAnomalies(items: readonly BonusOccurrence[]): SalaryAnomaly[] {
  const anomalies: SalaryAnomaly[] = [];
  const seen = new Map<string, number>();
  for (const item of items) {
    if (item.expectedAmount < 0 || item.actualAmount < 0) throw new RangeError('Montant de prime négatif.');
    const key = item.name.toLocaleLowerCase('fr-FR').trim();
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if (item.recurring && item.expectedAmount > 0 && item.actualAmount === 0) {
      anomalies.push({ type: 'missingBonus', label: item.name, reason: 'Prime récurrente attendue mais non constatée.' });
    } else if (item.expectedAmount > 0 && item.actualAmount > 0 && item.actualAmount < item.expectedAmount * 0.75) {
      anomalies.push({ type: 'lowBonus', label: item.name, reason: 'Montant sensiblement inférieur à la référence configurée.' });
    } else if (item.expectedAmount === 0 && item.actualAmount > 0) {
      anomalies.push({ type: 'unexpectedBonus', label: item.name, reason: 'Prime non prévue dans la configuration.' });
    }
  }
  for (const [key, count] of seen) {
    if (count > 1) anomalies.push({ type: 'doubleBonus', label: key, reason: 'Plusieurs lignes portant le même nom ont été détectées.' });
  }
  return anomalies;
}
