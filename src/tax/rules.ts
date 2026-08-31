export interface TaxRule<T> {
  id: string;
  ruleVersion: string;
  validFrom: string;
  validUntil: string | null;
  sourceTitle: string;
  sourceUrl: string;
  sourceDate: string;
  retrievedAt: string;
  verifiedAt: string;
  value: T;
  scope: string;
  caveat: string;
}

const IMPOTS_MOBILIERS = 'https://www.impots.gouv.fr/particulier/les-revenus-mobiliers';
const IMPOTS_PEA = 'https://www.impots.gouv.fr/particulier/les-revenus-depargne-et-de-placement';
const IMPOTS_CESSIONS = 'https://www.impots.gouv.fr/particulier/les-cessions-mobilieres';

export const TAX_RULES_2026 = {
  pfuIncomeTaxRate: {
    id: 'pfu-income-tax-rate',
    ruleVersion: 'FR-PFU-2026-01',
    validFrom: '2026-01-01',
    validUntil: null,
    sourceTitle: 'Les revenus mobiliers — impots.gouv.fr',
    sourceUrl: IMPOTS_MOBILIERS,
    sourceDate: '2026-07-17',
    retrievedAt: '2026-08-31',
    verifiedAt: '2026-08-31',
    value: 0.128,
    scope: 'Part d’impôt sur le revenu du PFU applicable aux revenus mobiliers concernés.',
    caveat: 'Des régimes particuliers, exonérations ou options peuvent modifier le traitement.'
  } satisfies TaxRule<number>,
  financialSocialContributionsRate: {
    id: 'financial-social-contributions-2026',
    ruleVersion: 'FR-PS-MOB-2026-01',
    validFrom: '2026-01-01',
    validUntil: null,
    sourceTitle: 'Les revenus mobiliers — impots.gouv.fr',
    sourceUrl: IMPOTS_MOBILIERS,
    sourceDate: '2026-07-17',
    retrievedAt: '2026-08-31',
    verifiedAt: '2026-08-31',
    value: 0.186,
    scope: 'Prélèvements sociaux indiqués par impots.gouv.fr pour les revenus mobiliers concernés à compter de 2026.',
    caveat: 'Ne pas réutiliser automatiquement ce taux pour tous les revenus patrimoniaux : le régime dépend de la nature du revenu.'
  } satisfies TaxRule<number>,
  deductibleCsgProgressiveRate: {
    id: 'deductible-csg-progressive',
    ruleVersion: 'FR-CSG-DED-2026-01',
    validFrom: '2026-01-01',
    validUntil: null,
    sourceTitle: 'Les revenus mobiliers — impots.gouv.fr',
    sourceUrl: IMPOTS_MOBILIERS,
    sourceDate: '2026-07-17',
    retrievedAt: '2026-08-31',
    verifiedAt: '2026-08-31',
    value: 0.068,
    scope: 'Part de CSG indiquée comme déductible en cas d’option globale pour le barème progressif, lorsque les conditions sont remplies.',
    caveat: 'Simulation simplifiée ; la déductibilité effective dépend de la situation fiscale.'
  } satisfies TaxRule<number>,
  eligibleDividendAllowance: {
    id: 'eligible-dividend-allowance',
    ruleVersion: 'FR-DIV-ABAT-2026-01',
    validFrom: '2026-01-01',
    validUntil: null,
    sourceTitle: 'Les revenus mobiliers — impots.gouv.fr',
    sourceUrl: IMPOTS_MOBILIERS,
    sourceDate: '2026-07-17',
    retrievedAt: '2026-08-31',
    verifiedAt: '2026-08-31',
    value: 0.40,
    scope: 'Abattement sur certains dividendes éligibles en cas d’option pour le barème progressif.',
    caveat: 'L’éligibilité du dividende doit être vérifiée ; l’option 2OP est globale pour les revenus concernés.'
  } satisfies TaxRule<number>,
  capitalLossCarryForwardYears: {
    id: 'securities-loss-carry-forward-years',
    ruleVersion: 'FR-MV-REPORT-2026-01',
    validFrom: '2026-01-01',
    validUntil: null,
    sourceTitle: 'Les cessions mobilières — impots.gouv.fr',
    sourceUrl: IMPOTS_CESSIONS,
    sourceDate: '2026-07-17',
    retrievedAt: '2026-08-31',
    verifiedAt: '2026-08-31',
    value: 10,
    scope: 'Durée de report des moins-values mobilières sur des plus-values de même nature, sous réserve des règles applicables.',
    caveat: 'La qualification et l’imputation doivent être rapprochées de l’IFU, de la déclaration et des notices.'
  } satisfies TaxRule<number>,
  peaFiveYearThreshold: {
    id: 'pea-five-year-threshold',
    ruleVersion: 'FR-PEA-5Y-2026-01',
    validFrom: '2026-01-01',
    validUntil: null,
    sourceTitle: 'Revenus d’épargne et de placement : PEA — impots.gouv.fr',
    sourceUrl: IMPOTS_PEA,
    sourceDate: '2026-07-17',
    retrievedAt: '2026-08-31',
    verifiedAt: '2026-08-31',
    value: 5,
    scope: 'Seuil d’ancienneté du PEA calculé à partir du premier versement pour distinguer les conséquences usuelles des retraits.',
    caveat: 'Des exceptions existent ; toujours vérifier les conditions du retrait et la documentation fiscale en vigueur.'
  } satisfies TaxRule<number>
} as const;

export type RuleFreshness = 'fresh' | 'warning' | 'expired';

export function ruleFreshness(rule: TaxRule<unknown>, today = new Date()): RuleFreshness {
  const verified = new Date(`${rule.verifiedAt}T00:00:00Z`);
  const ageDays = Math.floor((today.getTime() - verified.getTime()) / 86_400_000);
  if (ageDays < 90) return 'fresh';
  if (ageDays <= 180) return 'warning';
  return 'expired';
}
