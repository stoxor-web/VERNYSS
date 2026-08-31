import { assertFiniteNonNegative, assertRate } from '../types/common';

export interface MortgageInput {
  principal: number;
  annualRate: number;
  insuranceAnnualRate: number;
  termMonths: number;
}

export interface AmortizationRow {
  month: number;
  openingPrincipal: number;
  principalPaid: number;
  interestPaid: number;
  insurancePaid: number;
  payment: number;
  closingPrincipal: number;
}

export interface MortgageResult {
  monthlyLoanPayment: number;
  monthlyInsurance: number;
  monthlyPayment: number;
  totalInterest: number;
  totalInsurance: number;
  totalCost: number;
  schedule: AmortizationRow[];
}

export function mortgage(input: MortgageInput): MortgageResult {
  assertFiniteNonNegative(input.principal, 'Capital emprunté');
  assertRate(input.annualRate, 'Taux annuel');
  assertRate(input.insuranceAnnualRate, 'Taux annuel assurance');
  if (!Number.isInteger(input.termMonths) || input.termMonths < 1 || input.termMonths > 600) {
    throw new RangeError('Durée du crédit invalide.');
  }
  const monthlyRate = input.annualRate / 12;
  const monthlyLoanPayment = monthlyRate === 0
    ? input.principal / input.termMonths
    : input.principal * monthlyRate / (1 - (1 + monthlyRate) ** -input.termMonths);
  const monthlyInsurance = input.principal * input.insuranceAnnualRate / 12;
  let remaining = input.principal;
  let totalInterest = 0;
  let totalInsurance = 0;
  const schedule: AmortizationRow[] = [];
  for (let month = 1; month <= input.termMonths; month += 1) {
    const openingPrincipal = remaining;
    const interestPaid = openingPrincipal * monthlyRate;
    const principalPaid = Math.min(openingPrincipal, Math.max(0, monthlyLoanPayment - interestPaid));
    remaining = Math.max(0, openingPrincipal - principalPaid);
    totalInterest += interestPaid;
    totalInsurance += monthlyInsurance;
    schedule.push({
      month,
      openingPrincipal,
      principalPaid,
      interestPaid,
      insurancePaid: monthlyInsurance,
      payment: principalPaid + interestPaid + monthlyInsurance,
      closingPrincipal: remaining
    });
  }
  return {
    monthlyLoanPayment,
    monthlyInsurance,
    monthlyPayment: monthlyLoanPayment + monthlyInsurance,
    totalInterest,
    totalInsurance,
    totalCost: input.principal + totalInterest + totalInsurance,
    schedule
  };
}
