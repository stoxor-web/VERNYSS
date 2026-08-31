export type ISODate = `${number}-${number}-${number}`;
export type YearMonth = `${number}-${number}`;

export interface AuditFields {
  createdAt: unknown;
  updatedAt: unknown;
  schemaVersion: number;
}

export interface MoneyValue {
  amount: number;
  currency: 'EUR';
}

export type Confidence = number;
export type Urgency = 'low' | 'medium' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high';

export function assertFiniteNonNegative(value: number, label: string, max = 100_000_000): void {
  if (!Number.isFinite(value) || value < 0 || value > max) {
    throw new RangeError(`${label} doit être compris entre 0 et ${max}.`);
  }
}

export function assertRate(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${label} doit être compris entre 0 et 1.`);
  }
}
