export function boundedText(value: string, maxLength: number): string {
  const normalized = value.normalize('NFC').trim();
  if (normalized.length > maxLength) throw new RangeError(`Texte limité à ${maxLength} caractères.`);
  return normalized;
}

export function boundedAmount(value: number, options: { signed?: boolean; max?: number } = {}): number {
  const max = options.max ?? 100_000_000;
  const min = options.signed === true ? -max : 0;
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError('Montant hors bornes.');
  return value;
}
