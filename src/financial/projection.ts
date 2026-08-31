import { assertFiniteNonNegative } from '../types/common';

export interface ProjectionPoint {
  month: number;
  contributed: number;
  projectedValue: number;
}

export function projectMonthlySavings(initial: number, monthlyContribution: number, annualReturn: number, months: number): ProjectionPoint[] {
  assertFiniteNonNegative(initial, 'Capital initial');
  assertFiniteNonNegative(monthlyContribution, 'Versement mensuel');
  if (!Number.isFinite(annualReturn) || annualReturn <= -1 || annualReturn > 2) {
    throw new RangeError('Rendement annuel hors bornes de simulation.');
  }
  if (!Number.isInteger(months) || months < 0 || months > 1200) {
    throw new RangeError('Durée de projection invalide.');
  }
  const monthlyRate = (1 + annualReturn) ** (1 / 12) - 1;
  const points: ProjectionPoint[] = [{ month: 0, contributed: initial, projectedValue: initial }];
  let value = initial;
  let contributed = initial;
  for (let month = 1; month <= months; month += 1) {
    value = value * (1 + monthlyRate) + monthlyContribution;
    contributed += monthlyContribution;
    points.push({ month, contributed, projectedValue: value });
  }
  return points;
}
