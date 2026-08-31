import { assertFiniteNonNegative, assertRate } from '../types/common';

export interface RentalInput {
  purchasePrice: number;
  acquisitionCosts: number;
  works: number;
  annualRent: number;
  vacancyRate: number;
  annualNonRecoverableCharges: number;
  annualPropertyTax: number;
  annualInsurance: number;
  annualManagement: number;
  annualMaintenance: number;
  annualDebtService: number;
  annualInterest: number;
  annualTaxEstimate: number;
  equityInvested: number;
  annualPrincipalRepaid: number;
}

export function rentalMetrics(input: RentalInput) {
  for (const [label, value] of Object.entries(input)) {
    if (label === 'vacancyRate') continue;
    assertFiniteNonNegative(value, label);
  }
  assertRate(input.vacancyRate, 'Vacance');
  const totalProjectCost = input.purchasePrice + input.acquisitionCosts + input.works;
  const collectedRent = input.annualRent * (1 - input.vacancyRate);
  const operatingCosts = input.annualNonRecoverableCharges + input.annualPropertyTax + input.annualInsurance + input.annualManagement + input.annualMaintenance;
  const netOperatingIncome = collectedRent - operatingCosts;
  const cashFlowBeforeTax = netOperatingIncome - input.annualDebtService;
  const cashFlowAfterIndicativeTax = cashFlowBeforeTax - input.annualTaxEstimate;
  const grossYield = totalProjectCost === 0 ? null : input.annualRent / totalProjectCost;
  const netYield = totalProjectCost === 0 ? null : netOperatingIncome / totalProjectCost;
  const equityReturn = input.equityInvested === 0 ? null : (cashFlowAfterIndicativeTax + input.annualPrincipalRepaid) / input.equityInvested;
  return {
    totalProjectCost,
    collectedRent,
    netOperatingIncome,
    grossYield,
    netYield,
    cashFlowBeforeTax,
    cashFlowAfterIndicativeTax,
    equityReturn,
    annualPrincipalRepaid: input.annualPrincipalRepaid,
    warning: 'Fiscalité indicative uniquement : le résultat dépend du régime, des charges déductibles, de la situation du foyer et des règles applicables.'
  };
}
