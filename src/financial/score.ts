export type ScoreDimension = 'liquidity' | 'budget' | 'incomeStability' | 'salaryCoherence' | 'savingsRate' | 'debt' | 'diversification' | 'netWorth' | 'taxReadiness' | 'goals';

export interface ScoreInput {
  dimension: ScoreDimension;
  score: number;
  weight: number;
  explanation: string;
}

export interface FinancialScore {
  score: number;
  dimensions: ScoreInput[];
}

export function computeFinancialScore(dimensions: readonly ScoreInput[]): FinancialScore {
  if (dimensions.length === 0) return { score: 0, dimensions: [] };
  for (const item of dimensions) {
    if (item.score < 0 || item.score > 100 || item.weight < 0 || !Number.isFinite(item.score) || !Number.isFinite(item.weight)) {
      throw new RangeError('Dimension de score invalide.');
    }
  }
  const totalWeight = dimensions.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) throw new RangeError('Le poids total doit être positif.');
  const score = dimensions.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight;
  return { score: Math.round(score), dimensions: [...dimensions] };
}
