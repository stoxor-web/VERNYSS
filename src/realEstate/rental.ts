import {
  assertFiniteNonNegative,
  assertRate,
} from '../types/common';

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

export interface RentalMetrics {
  totalProjectCost: number;
  collectedRent: number;
  netOperatingIncome: number;
  grossYield: number | null;
  netYield: number | null;
  cashFlowBeforeTax: number;
  cashFlowAfterIndicativeTax: number;
  equityReturn: number | null;
  annualPrincipalRepaid: number;
  warning: string;
}

const nonRateFields: Array<
  Exclude<keyof RentalInput, 'vacancyRate'>
> = [
  'purchasePrice',
  'acquisitionCosts',
  'works',
  'annualRent',
  'annualNonRecoverableCharges',
  'annualPropertyTax',
  'annualInsurance',
  'annualManagement',
  'annualMaintenance',
  'annualDebtService',
  'annualInterest',
  'annualTaxEstimate',
  'equityInvested',
  'annualPrincipalRepaid',
];

export function rentalMetrics(
  input: RentalInput,
): RentalMetrics {
  for (const field of nonRateFields) {
    assertFiniteNonNegative(
      input[field],
      field,
    );
  }

  assertRate(
    input.vacancyRate,
    'Vacance',
  );

  const totalProjectCost =
    input.purchasePrice +
    input.acquisitionCosts +
    input.works;

  const collectedRent =
    input.annualRent *
    (1 - input.vacancyRate);

  const operatingCosts =
    input.annualNonRecoverableCharges +
    input.annualPropertyTax +
    input.annualInsurance +
    input.annualManagement +
    input.annualMaintenance;

  const netOperatingIncome =
    collectedRent -
    operatingCosts;

  const cashFlowBeforeTax =
    netOperatingIncome -
    input.annualDebtService;

  const cashFlowAfterIndicativeTax =
    cashFlowBeforeTax -
    input.annualTaxEstimate;

  const grossYield =
    totalProjectCost === 0
      ? null
      : input.annualRent /
        totalProjectCost;

  const netYield =
    totalProjectCost === 0
      ? null
      : netOperatingIncome /
        totalProjectCost;

  const equityReturn =
    input.equityInvested === 0
      ? null
      : (
          cashFlowAfterIndicativeTax +
          input.annualPrincipalRepaid
        ) /
        input.equityInvested;

  return {
    totalProjectCost,
    collectedRent,
    netOperatingIncome,
    grossYield,
    netYield,
    cashFlowBeforeTax,
    cashFlowAfterIndicativeTax,
    equityReturn,
    annualPrincipalRepaid:
      input.annualPrincipalRepaid,
    warning:
      'Fiscalité indicative uniquement : le résultat dépend du régime, des charges déductibles, de la situation du foyer et des règles applicables.',
  };
}