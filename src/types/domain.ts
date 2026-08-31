import type { AuditFields, RiskLevel, Urgency } from './common';

export type IncomeKind = 'salary' | 'electedAllowance' | 'selfEmployed' | 'rental' | 'exceptional' | 'other';

export interface Income extends AuditFields {
  kind: IncomeKind;
  label: string;
  amount: number;
  receivedAt: Date;
  recurring: boolean;
}

export interface Expense extends AuditFields {
  label: string;
  amount: number;
  category: string;
  subcategory?: string;
  occurredAt: Date;
  essential: boolean;
  fixed: boolean;
}

export interface Goal extends AuditFields {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  priority: number;
}

export type OpportunityCategory = 'tax' | 'investment' | 'budget' | 'salary' | 'realEstate' | 'credit' | 'cash' | 'risk' | 'administrative';

export interface Opportunity extends AuditFields {
  id: string;
  title: string;
  category: OpportunityCategory;
  description: string;
  potentialImpact?: number;
  confidence: number;
  urgency: Urgency;
  risk: RiskLevel;
  reason: string;
  sources: string[];
  expiresAt?: Date;
}
