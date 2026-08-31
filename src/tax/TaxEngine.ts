import { assertFiniteNonNegative, assertRate } from '../types/common';
import { TAX_RULES_2026 } from './rules';

export interface LossCarryForward {
  originYear: number;
  initialAmount: number;
  usedAmount: number;
  remainingAmount: number;
  expiresYear: number;
}

export interface AppliedLoss {
  originYear: number;
  amountUsed: number;
}

export interface CtoTaxEstimate {
  taxableRealizedGain: number;
  appliedLosses: AppliedLoss[];
  incomeTaxEstimate: number;
  socialContributionsEstimate: number;
  totalEstimate: number;
  warnings: string[];
}

export interface PfuVsScaleInput {
  eligibleDividends: number;
  otherInvestmentIncome: number;
  realizedCapitalGains: number;
  indicativeMarginalRate: number;
}

export interface TaxOptionEstimate {
  pfu: number;
  progressiveScaleIndicative: number;
  lowerIndicativeOption: 'PFU' | 'BAREME' | 'EQUAL';
  warnings: string[];
}

export class TaxEngine {
  ctoPfuEstimate(realizedGain: number, carryForwards: readonly LossCarryForward[], taxYear: number): CtoTaxEstimate {
    assertFiniteNonNegative(realizedGain, 'Plus-value réalisée');
    if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2100) throw new RangeError('Année fiscale invalide.');
    let taxable = realizedGain;
    const appliedLosses: AppliedLoss[] = [];
    const sorted = [...carryForwards].sort((a, b) => a.originYear - b.originYear);
    for (const loss of sorted) {
      assertFiniteNonNegative(loss.remainingAmount, `Report ${loss.originYear}`);
      if (loss.expiresYear < taxYear || loss.originYear >= taxYear || taxable <= 0) continue;
      const used = Math.min(loss.remainingAmount, taxable);
      taxable -= used;
      appliedLosses.push({ originYear: loss.originYear, amountUsed: used });
    }
    const incomeTaxEstimate = taxable * TAX_RULES_2026.pfuIncomeTaxRate.value;
    const socialContributionsEstimate = taxable * TAX_RULES_2026.financialSocialContributionsRate.value;
    return {
      taxableRealizedGain: taxable,
      appliedLosses,
      incomeTaxEstimate,
      socialContributionsEstimate,
      totalEstimate: incomeTaxEstimate + socialContributionsEstimate,
      warnings: [
        'Simulation simplifiée. Les plus-values latentes ne sont jamais intégrées à l’impôt dû.',
        'À comparer avec l’IFU, la déclaration préremplie et, si nécessaire, le formulaire 2074/2074-CMV.'
      ]
    };
  }

  pfuVsProgressive(input: PfuVsScaleInput): TaxOptionEstimate {
    assertFiniteNonNegative(input.eligibleDividends, 'Dividendes éligibles');
    assertFiniteNonNegative(input.otherInvestmentIncome, 'Autres revenus mobiliers');
    assertFiniteNonNegative(input.realizedCapitalGains, 'Plus-values réalisées');
    assertRate(input.indicativeMarginalRate, 'TMI indicative');
    const gross = input.eligibleDividends + input.otherInvestmentIncome + input.realizedCapitalGains;
    const pfu = gross * (TAX_RULES_2026.pfuIncomeTaxRate.value + TAX_RULES_2026.financialSocialContributionsRate.value);
    const dividendTaxableBase = input.eligibleDividends * (1 - TAX_RULES_2026.eligibleDividendAllowance.value);
    const progressiveIncomeTax = (dividendTaxableBase + input.otherInvestmentIncome + input.realizedCapitalGains) * input.indicativeMarginalRate;
    const social = gross * TAX_RULES_2026.financialSocialContributionsRate.value;
    const indicativeDeductibleCsgBenefit = gross * TAX_RULES_2026.deductibleCsgProgressiveRate.value * input.indicativeMarginalRate;
    const progressiveScaleIndicative = Math.max(0, progressiveIncomeTax + social - indicativeDeductibleCsgBenefit);
    const lowerIndicativeOption = Math.abs(pfu - progressiveScaleIndicative) < 0.01 ? 'EQUAL' : pfu < progressiveScaleIndicative ? 'PFU' : 'BAREME';
    return {
      pfu,
      progressiveScaleIndicative,
      lowerIndicativeOption,
      warnings: [
        'Simulation simplifiée : elle ne calcule pas l’impôt complet du foyer.',
        'L’option pour le barème (case 2OP) est globale pour les revenus concernés ; l’éligibilité à l’abattement de 40 % doit être vérifiée.',
        'Les taux sont issus des règles versionnées ; contrôler leur fraîcheur avant une décision.'
      ]
    };
  }

  peaWithdrawal(firstContributionDate: Date, withdrawalDate: Date, gainComponent: number) {
    assertFiniteNonNegative(gainComponent, 'Part de gain du retrait');
    if (withdrawalDate < firstContributionDate) throw new RangeError('Le retrait ne peut précéder le premier versement.');
    const anniversary = new Date(firstContributionDate);
    anniversary.setFullYear(anniversary.getFullYear() + TAX_RULES_2026.peaFiveYearThreshold.value);
    const afterFiveYears = withdrawalDate >= anniversary;
    const incomeTaxEstimate = afterFiveYears ? 0 : gainComponent * TAX_RULES_2026.pfuIncomeTaxRate.value;
    const socialContributionsEstimate = gainComponent * TAX_RULES_2026.financialSocialContributionsRate.value;
    return {
      afterFiveYears,
      incomeTaxEstimate,
      socialContributionsEstimate,
      totalEstimate: incomeTaxEstimate + socialContributionsEstimate,
      warning: 'Estimation indicative. Des exceptions existent et les prélèvements sociaux peuvent dépendre de règles historiques pour certains gains : vérifiez la documentation fiscale applicable au retrait.'
    };
  }

  pelRegime(openingDate: Date) {
    const threshold = new Date('2018-01-01T00:00:00Z');
    if (openingDate >= threshold) {
      return {
        status: 'verified-modern' as const,
        message: 'PEL ouvert à partir de 2018 : intérêts soumis à l’impôt sur le revenu et aux prélèvements sociaux selon les règles applicables.',
        needsConfirmation: false
      };
    }
    return {
      status: 'date-dependent' as const,
      message: 'PEL ouvert avant 2018 : le régime dépend de la date d’ouverture et de l’ancienneté. À confirmer avant calcul.',
      needsConfirmation: true
    };
  }
}
