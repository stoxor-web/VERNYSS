import { assertFiniteNonNegative } from '../types/common';

export interface PrepaymentComparisonInput {
  amount: number;
  remainingLoanAnnualRate: number;
  alternativeExpectedAnnualReturn: number;
  horizonYears: number;
  prepaymentFees: number;
  investmentFees: number;
}

export function comparePrepaymentVsInvestment(input: PrepaymentComparisonInput) {
  assertFiniteNonNegative(input.amount, 'Montant disponible');
  assertFiniteNonNegative(input.prepaymentFees, 'Frais de remboursement anticipé');
  assertFiniteNonNegative(input.investmentFees, 'Frais d’investissement');
  if (input.remainingLoanAnnualRate < 0 || input.remainingLoanAnnualRate > 1) throw new RangeError('Taux de crédit invalide.');
  if (input.alternativeExpectedAnnualReturn <= -1 || input.alternativeExpectedAnnualReturn > 2) throw new RangeError('Rendement alternatif invalide.');
  if (!Number.isInteger(input.horizonYears) || input.horizonYears < 1 || input.horizonYears > 50) throw new RangeError('Horizon invalide.');
  const debtBenefit = Math.max(0, input.amount - input.prepaymentFees) * ((1 + input.remainingLoanAnnualRate) ** input.horizonYears - 1);
  const investedCapital = Math.max(0, input.amount - input.investmentFees);
  const investmentGain = investedCapital * ((1 + input.alternativeExpectedAnnualReturn) ** input.horizonYears - 1);
  return {
    debtBenefit,
    investmentGain,
    difference: investmentGain - debtBenefit,
    warning: 'Le rendement d’investissement est incertain alors que l’économie d’intérêts est davantage déterministe. Intégrer liquidité, fiscalité, risque et pénalités.'
  };
}
