import type { AdvisorOpportunity } from './types';

const urgencyScore = { low: 1, medium: 2, high: 3 } as const;
const riskPenalty = { low: 0, medium: 0.25, high: 0.5 } as const;

export function opportunityPriority(item: AdvisorOpportunity, estimatedComplexity: 'low' | 'medium' | 'high' = 'medium'): number {
  const complexityPenalty = estimatedComplexity === 'high' ? 0.6 : estimatedComplexity === 'medium' ? 0.3 : 0.1;
  const impact = item.potentialImpact === undefined ? 0.5 : Math.min(1, Math.abs(item.potentialImpact) / 1000);
  return Math.max(0, urgencyScore[item.urgency] + impact + item.confidence - riskPenalty[item.risk] - complexityPenalty);
}

export function explainOpportunity(item: AdvisorOpportunity) {
  return { dataUsed: item.dataUsed, rule: item.reason, assumptions: item.assumptions, risks: item.risk, sources: item.sources };
}
