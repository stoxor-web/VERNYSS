export interface TransactionLike {
  id: string;
  label: string;
  amount: number;
  date: string;
}

export interface RecurringSignal {
  normalizedLabel: string;
  occurrences: number;
  medianAmount: number;
  latestAmount: number;
  amountChangeRatio: number;
  potentialDuplicateIds: string[];
}

function normalizeLabel(label: string): string {
  return label.toLocaleLowerCase('fr-FR').replace(/\d+/g, '').replace(/[^a-zà-ÿ ]/gi, ' ').replace(/\s+/g, ' ').trim();
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const center = sorted[mid];
  if (center === undefined) return 0;
  if (sorted.length % 2 === 1) return center;
  const previous = sorted[mid - 1] ?? center;
  return (previous + center) / 2;
}

export function detectRecurring(transactions: readonly TransactionLike[]): RecurringSignal[] {
  const groups = new Map<string, TransactionLike[]>();
  for (const tx of transactions) {
    if (!Number.isFinite(tx.amount) || tx.amount < 0) throw new RangeError('Montant de transaction invalide.');
    const key = normalizeLabel(tx.label);
    if (key.length === 0) continue;
    const group = groups.get(key) ?? [];
    group.push(tx);
    groups.set(key, group);
  }
  return [...groups.entries()].filter(([, group]) => group.length >= 2).map(([key, group]) => {
    const ordered = [...group].sort((a, b) => a.date.localeCompare(b.date));
    const medianAmount = median(ordered.map((tx) => tx.amount));
    const latestAmount = ordered.at(-1)?.amount ?? 0;
    const amountChangeRatio = medianAmount === 0 ? 0 : (latestAmount - medianAmount) / medianAmount;
    const duplicateIds: string[] = [];
    for (let i = 1; i < ordered.length; i += 1) {
      const previous = ordered[i - 1];
      const current = ordered[i];
      if (previous !== undefined && current !== undefined && previous.date === current.date && Math.abs(previous.amount - current.amount) < 0.01) {
        duplicateIds.push(previous.id, current.id);
      }
    }
    return { normalizedLabel: key, occurrences: ordered.length, medianAmount, latestAmount, amountChangeRatio, potentialDuplicateIds: [...new Set(duplicateIds)] };
  });
}
