import { assertFiniteNonNegative } from '../types/common';

export interface CashFlowInput {
  income: number;
  expenses: number;
  automaticInvestments: number;
}

export function cashFlow(input: CashFlowInput): number {
  assertFiniteNonNegative(input.income, 'Revenus');
  assertFiniteNonNegative(input.expenses, 'Dépenses');
  assertFiniteNonNegative(input.automaticInvestments, 'Investissements automatiques');
  return input.income - input.expenses - input.automaticInvestments;
}

export function savingsRate(income: number, expenses: number): number | null {
  assertFiniteNonNegative(income, 'Revenus');
  assertFiniteNonNegative(expenses, 'Dépenses');
  if (income === 0) return null;
  return (income - expenses) / income;
}

export function emergencyFundCoverage(liquidReserve: number, monthlyEssentialExpenses: number): number | null {
  assertFiniteNonNegative(liquidReserve, 'Réserve liquide');
  assertFiniteNonNegative(monthlyEssentialExpenses, 'Dépenses essentielles');
  if (monthlyEssentialExpenses === 0) return null;
  return liquidReserve / monthlyEssentialExpenses;
}
