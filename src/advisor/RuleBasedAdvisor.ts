import type {
  AdvisorContext,
  AdvisorOpportunity,
  FinancialInsightProvider,
} from './types';

function urgencyWeight(
  urgency: AdvisorOpportunity['urgency'],
): number {
  if (urgency === 'high') {
    return 2;
  }

  if (urgency === 'medium') {
    return 1;
  }

  return 0;
}

export class RuleBasedAdvisor
  implements FinancialInsightProvider
{
  readonly mode = 'RULE_BASED' as const;

  analyze(
    context: AdvisorContext,
  ): Promise<AdvisorOpportunity[]> {
    const items: AdvisorOpportunity[] = [];

    if (
      context.emergencyFundMonths !== null &&
      context.emergencyFundMonths < 3
    ) {
      items.push({
        id: 'cash-buffer',
        title: 'Renforcer la réserve de sécurité',
        category: 'cash',
        description:
          'La réserve configurée couvre moins de trois mois de dépenses essentielles.',
        confidence: 0.95,
        urgency: 'high',
        risk: 'low',
        reason:
          'Prioriser la liquidité réduit le risque de devoir vendre un actif ou emprunter en cas d’imprévu.',
        dataUsed: [
          'réserve liquide',
          'dépenses essentielles',
        ],
        assumptions: [
          'objectif minimal configuré à 3 mois',
        ],
        sources: [],
      });
    }

    if (
      context.realEstateProjectMonthsAway !== null &&
      context.realEstateProjectMonthsAway < 24
    ) {
      items.push({
        id: 'property-liquidity',
        title: 'Isoler l’apport immobilier',
        category: 'realEstate',
        description:
          'Un projet immobilier proche justifie de distinguer l’apport du capital long terme.',
        confidence: 0.9,
        urgency: 'medium',
        risk: 'medium',
        reason:
          'Un horizon court est peu compatible avec une exposition non maîtrisée à la volatilité.',
        dataUsed: [
          'horizon du projet',
        ],
        assumptions: [
          'le projet nécessite une liquidité disponible à la date cible',
        ],
        sources: [],
      });
    }

    if (
      context.expensiveDebtRate !== null &&
      context.expensiveDebtRate > 0.06
    ) {
      items.push({
        id: 'expensive-debt',
        title: 'Comparer dette et placement',
        category: 'credit',
        description:
          'Le coût nominal de la dette dépasse 6 % dans la configuration. Comparer un remboursement et un placement en intégrant risque, fiscalité et liquidité.',
        confidence: 0.85,
        urgency: 'medium',
        risk: 'medium',
        reason:
          'Une économie d’intérêt est plus déterministe qu’un rendement de marché attendu.',
        dataUsed: [
          'taux de dette',
        ],
        assumptions: [
          'pas de pénalité atypique de remboursement',
        ],
        sources: [],
      });
    }

    if (
      context.peaAgeYears !== null &&
      context.peaAgeYears < 5
    ) {
      items.push({
        id: 'pea-withdrawal',
        title:
          'Vérifier l’ancienneté du PEA avant retrait',
        category: 'tax',
        description:
          'Le PEA configuré a moins de cinq ans : un retrait peut avoir des conséquences fiscales et de fonctionnement spécifiques.',
        confidence: 0.98,
        urgency: 'medium',
        risk: 'medium',
        reason:
          'Le seuil des cinq ans est une règle fiscale versionnée dans le module fiscal.',
        dataUsed: [
          'date du premier versement PEA',
        ],
        assumptions: [],
        sources: [
          {
            title: 'impots.gouv.fr — PEA',
            url:
              'https://www.impots.gouv.fr/particulier/les-revenus-depargne-et-de-placement',
          },
        ],
      });
    }

    if (
      context.salaryGap !== null &&
      Math.abs(context.salaryGap) > 25
    ) {
      items.push({
        id: 'salary-gap',
        title: 'Contrôler le bulletin de paie',
        category: 'salary',
        description:
          'L’écart entre le net estimé et le net versé dépasse le seuil de vérification configuré.',
        confidence: 0.9,
        urgency: 'high',
        risk: 'low',
        reason:
          'Une incohérence potentielle est détectée. Vérifiez le bulletin ou le service paie ; le moteur n’affirme pas qu’une somme est due.',
        dataUsed: [
          'net estimé',
          'net versé',
          'seuil de vérification',
        ],
        assumptions: [
          'taux et éléments de paie correctement saisis',
        ],
        sources: [],
      });
    }

    const sorted = items
      .sort(
        (a, b) =>
          urgencyWeight(b.urgency) -
          urgencyWeight(a.urgency),
      )
      .slice(0, 7);

    return Promise.resolve(sorted);
  }
}