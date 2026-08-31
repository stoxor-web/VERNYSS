import type { OpportunityCategory } from '../types/domain';

export interface AdvisorSource {
  title: string;
  url?: string;
}

export interface AdvisorOpportunity {
  id: string;
  title: string;
  category: OpportunityCategory;
  description: string;
  potentialImpact?: number;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  reason: string;
  dataUsed: string[];
  assumptions: string[];
  sources: AdvisorSource[];
}

export interface AdvisorContext {
  emergencyFundMonths: number | null;
  realEstateProjectMonthsAway: number | null;
  expensiveDebtRate: number | null;
  peaAgeYears: number | null;
  salaryGap: number | null;
}

export interface FinancialInsightProvider {
  readonly mode: 'RULE_BASED' | 'FREE_TIER_AI';
  analyze(context: AdvisorContext): Promise<AdvisorOpportunity[]>;
}
