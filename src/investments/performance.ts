import { assertFiniteNonNegative } from '../types/common';

export interface PositionPerformanceInput {
  quantity: number;
  averageCost: number;
  currentPrice: number;
  realizedGain: number;
  dividends: number;
  fees: number;
}

export function positionPerformance(input: PositionPerformanceInput) {
  assertFiniteNonNegative(input.quantity, 'Quantité', 1_000_000_000);
  assertFiniteNonNegative(input.averageCost, 'PRU');
  assertFiniteNonNegative(input.currentPrice, 'Prix actuel');
  assertFiniteNonNegative(input.dividends, 'Dividendes');
  assertFiniteNonNegative(input.fees, 'Frais');
  if (!Number.isFinite(input.realizedGain)) throw new RangeError('Plus-value réalisée invalide.');
  const costBasis = input.quantity * input.averageCost;
  const marketValue = input.quantity * input.currentPrice;
  const unrealizedGain = marketValue - costBasis;
  const totalEconomicGain = unrealizedGain + input.realizedGain + input.dividends - input.fees;
  return { costBasis, marketValue, unrealizedGain, realizedGain: input.realizedGain, dividends: input.dividends, fees: input.fees, totalEconomicGain };
}
