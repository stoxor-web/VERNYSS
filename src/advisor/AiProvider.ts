import type {
  AdvisorContext,
  AdvisorOpportunity,
  FinancialInsightProvider,
} from './types';

export interface ExternalAiConsent {
  enabled: boolean;
  providerName: string | null;
  approvedDataCategories: string[];
}

export class FreeTierAiProvider
  implements FinancialInsightProvider
{
  readonly mode = 'FREE_TIER_AI' as const;

  constructor(
    private readonly consent: ExternalAiConsent,
  ) {}

  analyze(
    context: AdvisorContext,
  ): Promise<AdvisorOpportunity[]> {
    void context;

    if (
      !this.consent.enabled ||
      this.consent.providerName === null
    ) {
      return Promise.reject(
        new Error(
          'Analyse IA externe désactivée. Le consentement explicite est requis.',
        ),
      );
    }

    return Promise.reject(
      new Error(
        'Fonction optionnelle nécessitant potentiellement une facturation : aucun fournisseur IA distant n’est configuré dans le socle. Utilisez RULE_BASED ou implémentez un proxy serveur avec consentement explicite.',
      ),
    );
  }
}