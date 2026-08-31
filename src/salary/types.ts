export type SalaryLineKind =
  | 'base'
  | 'overtime'
  | 'allowance'
  | 'onCall'
  | 'standbyIntervention'
  | 'presenceDuty'
  | 'bonus'
  | 'expenseReimbursement'
  | 'benefitInKind'
  | 'absence'
  | 'deduction'
  | 'advance';

export interface SalaryLine {
  id: string;
  label: string;
  kind: SalaryLineKind;
  amount?: number;
  hours?: number;
  hourlyRate?: number;
  upliftRate?: number;
  subjectToContributions: boolean;
  subjectToIncomeTax: boolean;
  recurring?: boolean;
  expectedMonth?: string;
  actuallyPaidMonth?: string;
}

export interface SalaryCheckInput {
  lines: SalaryLine[];
  estimatedEmployeeContributionRate: number;
  withholdingRate: number;
  actualNetPaid?: number;
  gapMinorThreshold?: number;
  gapReviewThreshold?: number;
}

export type SalaryCheckStatus = 'ok' | 'minorGap' | 'review' | 'notCompared';

export interface SalaryBreakdownLine {
  id: string;
  label: string;
  kind: SalaryLineKind;
  amount: number;
}

export interface SalaryCheckResult {
  grossSubjectToContributions: number;
  estimatedEmployeeContributions: number;
  exemptAllowances: number;
  expenseReimbursements: number;
  netBeforeWithholding: number;
  withholdingBase: number;
  withholdingTax: number;
  expectedNetPaid: number;
  actualNetPaid?: number;
  gap?: number;
  gapPercent?: number;
  status: SalaryCheckStatus;
  breakdown: SalaryBreakdownLine[];
  warnings: string[];
}
