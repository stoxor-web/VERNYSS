import { assertFiniteNonNegative } from '../types/common';

export interface AllocationItem {
  key: string;
  currentValue: number;
  targetWeight: number;
}

export interface AllocationGap extends AllocationItem {
  currentWeight: number;
  gapWeight: number;
  targetValue: number;
  gapValue: number;
}

export function allocationGaps(items: readonly AllocationItem[]): AllocationGap[] {
  for (const item of items) {
    assertFiniteNonNegative(item.currentValue, `Valeur ${item.key}`);
    if (!Number.isFinite(item.targetWeight) || item.targetWeight < 0 || item.targetWeight > 1) {
      throw new RangeError(`Allocation cible invalide pour ${item.key}.`);
    }
  }
  const targetSum = items.reduce((sum, item) => sum + item.targetWeight, 0);
  if (items.length > 0 && Math.abs(targetSum - 1) > 0.0001) {
    throw new RangeError('La somme des allocations cibles doit être égale à 100 %.');
  }
  const total = items.reduce((sum, item) => sum + item.currentValue, 0);
  return items.map((item) => {
    const currentWeight = total === 0 ? 0 : item.currentValue / total;
    const targetValue = total * item.targetWeight;
    return {
      ...item,
      currentWeight,
      gapWeight: item.targetWeight - currentWeight,
      targetValue,
      gapValue: targetValue - item.currentValue
    };
  });
}
