import { assertFiniteNonNegative, assertRate } from '../types/common';
import type { SalaryCheckInput, SalaryCheckResult, SalaryLine } from './types';

const ADDITIVE_KINDS = new Set<SalaryLine['kind']>([
  'base', 'overtime', 'allowance', 'onCall', 'standbyIntervention', 'presenceDuty', 'bonus', 'expenseReimbursement', 'benefitInKind'
]);

const SUBTRACTIVE_KINDS = new Set<SalaryLine['kind']>(['absence', 'deduction', 'advance']);

function lineAmount(line: SalaryLine): number {
  if (line.amount !== undefined) {
    assertFiniteNonNegative(line.amount, line.label);
    return line.amount;
  }
  const hours = line.hours ?? 0;
  const hourlyRate = line.hourlyRate ?? 0;
  const upliftRate = line.upliftRate ?? 0;
  assertFiniteNonNegative(hours, `Heures ${line.label}`, 1000);
  assertFiniteNonNegative(hourlyRate, `Taux horaire ${line.label}`);
  if (!Number.isFinite(upliftRate) || upliftRate < 0 || upliftRate > 5) {
    throw new RangeError(`Majoration invalide pour ${line.label}.`);
  }
  return hours * hourlyRate * (1 + upliftRate);
}

export class SalaryCheckEngine {
  calculate(input: SalaryCheckInput): SalaryCheckResult {
    assertRate(input.estimatedEmployeeContributionRate, 'Taux de cotisations estimé');
    assertRate(input.withholdingRate, 'Taux de prélèvement à la source');
    if (input.actualNetPaid !== undefined) assertFiniteNonNegative(input.actualNetPaid, 'Net réellement payé');
    const gapMinorThreshold = input.gapMinorThreshold ?? 5;
    const gapReviewThreshold = input.gapReviewThreshold ?? 25;
    assertFiniteNonNegative(gapMinorThreshold, 'Seuil mineur');
    assertFiniteNonNegative(gapReviewThreshold, 'Seuil de vérification');
    if (gapMinorThreshold > gapReviewThreshold) throw new RangeError('Les seuils d’écart sont incohérents.');

    let grossSubject = 0;
    let exemptAllowances = 0;
    let expenseReimbursements = 0;
    let taxableOutsideContributions = 0;
    const breakdown = input.lines.map((line) => {
      const amount = lineAmount(line);
      const sign = SUBTRACTIVE_KINDS.has(line.kind) ? -1 : ADDITIVE_KINDS.has(line.kind) ? 1 : 0;
      const signedAmount = amount * sign;

      if (line.kind === 'expenseReimbursement') {
        expenseReimbursements += amount;
      } else if (line.subjectToContributions) {
        grossSubject += signedAmount;
      } else if (sign > 0) {
        exemptAllowances += amount;
        if (line.subjectToIncomeTax) taxableOutsideContributions += amount;
      } else {
        exemptAllowances += signedAmount;
      }
      return { id: line.id, label: line.label, kind: line.kind, amount: signedAmount };
    });

    grossSubject = Math.max(0, grossSubject);
    const estimatedEmployeeContributions = grossSubject * input.estimatedEmployeeContributionRate;
    const netBeforeWithholding = Math.max(0, grossSubject - estimatedEmployeeContributions + exemptAllowances + expenseReimbursements);
    const withholdingBase = Math.max(0, grossSubject - estimatedEmployeeContributions + taxableOutsideContributions);
    const withholdingTax = withholdingBase * input.withholdingRate;
    const expectedNetPaid = Math.max(0, netBeforeWithholding - withholdingTax);

    let status: SalaryCheckResult['status'] = 'notCompared';
    let gap: number | undefined;
    let gapPercent: number | undefined;
    if (input.actualNetPaid !== undefined) {
      gap = input.actualNetPaid - expectedNetPaid;
      gapPercent = expectedNetPaid === 0 ? 0 : (gap / expectedNetPaid) * 100;
      const absoluteGap = Math.abs(gap);
      status = absoluteGap < gapMinorThreshold ? 'ok' : absoluteGap <= gapReviewThreshold ? 'minorGap' : 'review';
    }

    const warnings = [
      'ESTIMATION : le calcul exact dépend notamment de la convention collective, des cotisations, de la mutuelle, de la prévoyance, des plafonds sociaux et des régularisations.',
      'À confirmer avec votre convention collective ou accord d’entreprise.',
      'Une incohérence potentielle n’établit pas une créance : vérifiez votre bulletin et, si nécessaire, le service paie.'
    ];

    return {
      grossSubjectToContributions: grossSubject,
      estimatedEmployeeContributions,
      exemptAllowances,
      expenseReimbursements,
      netBeforeWithholding,
      withholdingBase,
      withholdingTax,
      expectedNetPaid,
      ...(input.actualNetPaid === undefined ? {} : { actualNetPaid: input.actualNetPaid }),
      ...(gap === undefined ? {} : { gap }),
      ...(gapPercent === undefined ? {} : { gapPercent }),
      status,
      breakdown,
      warnings
    };
  }
}
