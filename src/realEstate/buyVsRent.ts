import { assertFiniteNonNegative } from '../types/common';
import { mortgage } from './mortgage';

export interface BuyVsRentScenario {
  name: 'Prudent' | 'Central' | 'Optimiste';
  propertyGrowthRate: number;
  alternativeReturnRate: number;
  rentGrowthRate: number;
}

export interface BuyVsRentInput {
  purchasePrice: number;
  downPayment: number;
  mortgageAnnualRate: number;
  insuranceAnnualRate: number;
  termMonths: number;
  notaryFees: number;
  initialWorks: number;
  annualPropertyTax: number;
  annualOwnerCharges: number;
  annualMaintenance: number;
  currentMonthlyRent: number;
  horizonYears: number;
}

export interface BuyVsRentPoint {
  year: number;
  buyerNetPosition: number;
  renterInvestmentPosition: number;
  difference: number;
}

export interface BuyVsRentResult {
  scenario: BuyVsRentScenario;
  points: BuyVsRentPoint[];
  breakEvenYear: number | null;
  message: string;
}

function validateRate(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= -1 || value > 1) throw new RangeError(`${label} hors bornes.`);
}

export function simulateBuyVsRent(input: BuyVsRentInput, scenario: BuyVsRentScenario): BuyVsRentResult {
  assertFiniteNonNegative(input.purchasePrice, 'Prix du bien');
  assertFiniteNonNegative(input.downPayment, 'Apport');
  assertFiniteNonNegative(input.notaryFees, 'Frais de notaire');
  assertFiniteNonNegative(input.initialWorks, 'Travaux');
  assertFiniteNonNegative(input.annualPropertyTax, 'Taxe foncière');
  assertFiniteNonNegative(input.annualOwnerCharges, 'Charges propriétaire');
  assertFiniteNonNegative(input.annualMaintenance, 'Entretien');
  assertFiniteNonNegative(input.currentMonthlyRent, 'Loyer');
  if (input.downPayment > input.purchasePrice) throw new RangeError('L’apport ne peut dépasser le prix d’achat dans cette simulation.');
  if (!Number.isInteger(input.horizonYears) || input.horizonYears < 1 || input.horizonYears > 50) throw new RangeError('Horizon invalide.');
  validateRate(scenario.propertyGrowthRate, 'Évolution du prix immobilier');
  validateRate(scenario.alternativeReturnRate, 'Rendement alternatif');
  validateRate(scenario.rentGrowthRate, 'Hausse des loyers');
  const principal = input.purchasePrice - input.downPayment;
  const loan = mortgage({ principal, annualRate: input.mortgageAnnualRate, insuranceAnnualRate: input.insuranceAnnualRate, termMonths: input.termMonths });
  let renterPortfolio = input.downPayment + input.notaryFees + input.initialWorks;
  let propertyValue = input.purchasePrice;
  let rent = input.currentMonthlyRent;
  const points: BuyVsRentPoint[] = [];
  let breakEvenYear: number | null = null;
  for (let year = 1; year <= input.horizonYears; year += 1) {
    propertyValue *= 1 + scenario.propertyGrowthRate;
    renterPortfolio *= 1 + scenario.alternativeReturnRate;
    let ownerCashOut = 0;
    let renterCashOut = 0;
    for (let month = 1; month <= 12; month += 1) {
      const globalMonth = (year - 1) * 12 + month;
      const debtPayment = loan.schedule[globalMonth - 1]?.payment ?? 0;
      ownerCashOut += debtPayment + (input.annualPropertyTax + input.annualOwnerCharges + input.annualMaintenance) / 12;
      renterCashOut += rent;
    }
    const monthlyDifference = (ownerCashOut - renterCashOut) / 12;
    if (monthlyDifference > 0) renterPortfolio += monthlyDifference * 12;
    rent *= 1 + scenario.rentGrowthRate;
    const outstanding = loan.schedule[Math.min(year * 12, loan.schedule.length) - 1]?.closingPrincipal ?? 0;
    const buyerNetPosition = propertyValue - outstanding - input.notaryFees - input.initialWorks;
    const renterInvestmentPosition = renterPortfolio;
    const difference = buyerNetPosition - renterInvestmentPosition;
    points.push({ year, buyerNetPosition, renterInvestmentPosition, difference });
    if (breakEvenYear === null && difference >= 0) breakEvenYear = year;
  }
  return {
    scenario,
    points,
    breakEvenYear,
    message: breakEvenYear === null
      ? 'Dans ce scénario et cet horizon, aucun seuil d’équilibre n’est constaté. Cela ne signifie pas qu’il faut louer : examinez les hypothèses et les contraintes personnelles.'
      : `Seuil d’équilibre indicatif autour de l’année ${breakEvenYear}. Comparer les scénarios et la sensibilité des hypothèses.`
  };
}

export const DEFAULT_BUY_VS_RENT_SCENARIOS: BuyVsRentScenario[] = [
  { name: 'Prudent', propertyGrowthRate: -0.01, alternativeReturnRate: 0.03, rentGrowthRate: 0.01 },
  { name: 'Central', propertyGrowthRate: 0.015, alternativeReturnRate: 0.045, rentGrowthRate: 0.02 },
  { name: 'Optimiste', propertyGrowthRate: 0.035, alternativeReturnRate: 0.06, rentGrowthRate: 0.025 }
];
