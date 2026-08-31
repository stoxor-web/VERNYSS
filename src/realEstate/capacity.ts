import { assertFiniteNonNegative, assertRate } from '../types/common';

export interface PurchaseCapacityInput {
  stableMonthlyIncome: number;
  otherStableMonthlyIncome: number;
  monthlyDebtPayments: number;
  monthlyRecurringCharges: number;
  maxDebtServiceRatio: number;
  annualRate: number;
  insuranceAnnualRate: number;
  termMonths: number;
  availableSavings: number;
  reserveToKeep: number;
  acquisitionCostRate: number;
}

export function purchaseCapacity(input: PurchaseCapacityInput) {
  assertFiniteNonNegative(input.stableMonthlyIncome, 'Revenu stable');
  assertFiniteNonNegative(input.otherStableMonthlyIncome, 'Autres revenus stables');
  assertFiniteNonNegative(input.monthlyDebtPayments, 'Crédits existants');
  assertFiniteNonNegative(input.monthlyRecurringCharges, 'Charges récurrentes');
  assertFiniteNonNegative(input.availableSavings, 'Épargne disponible');
  assertFiniteNonNegative(input.reserveToKeep, 'Réserve à conserver');
  assertRate(input.maxDebtServiceRatio, 'Taux d’effort cible');
  assertRate(input.annualRate, 'Taux du crédit');
  assertRate(input.insuranceAnnualRate, 'Taux assurance');
  assertRate(input.acquisitionCostRate, 'Taux de frais d’acquisition');
  if (!Number.isInteger(input.termMonths) || input.termMonths < 12 || input.termMonths > 600) throw new RangeError('Durée invalide.');
  const income = input.stableMonthlyIncome + input.otherStableMonthlyIncome;
  const maxHousingPayment = Math.max(0, income * input.maxDebtServiceRatio - input.monthlyDebtPayments - input.monthlyRecurringCharges);
  const monthlyRate = input.annualRate / 12;
  const monthlyInsuranceFactor = input.insuranceAnnualRate / 12;
  const effectivePaymentForLoan = Math.max(0, maxHousingPayment);
  const denominator = monthlyRate === 0
    ? (1 / input.termMonths) + monthlyInsuranceFactor
    : (monthlyRate / (1 - (1 + monthlyRate) ** -input.termMonths)) + monthlyInsuranceFactor;
  const borrowingCapacity = denominator === 0 ? 0 : effectivePaymentForLoan / denominator;
  const usableContribution = Math.max(0, input.availableSavings - input.reserveToKeep);
  const grossBudgetBeforeFees = borrowingCapacity + usableContribution;
  const indicativePurchasePrice = grossBudgetBeforeFees / (1 + input.acquisitionCostRate);
  return {
    maxHousingPayment,
    borrowingCapacity,
    usableContribution,
    reserveKept: Math.min(input.reserveToKeep, input.availableSavings),
    indicativePurchasePrice,
    warning: 'Capacité indicative, pas une décision de crédit. Une banque applique ses propres critères et peut retenir différemment les revenus et charges.'
  };
}
