import type { NewsCategory, NormalizedNews } from './types';

const rules: Array<{ category: NewsCategory; words: string[]; why: string; action: string }> = [
  { category: 'tax', words: ['impôt', 'fiscal', 'déclaration', 'pea', 'prélèvement'], why: 'Peut modifier une échéance, un calcul ou une règle fiscale.', action: 'Vérifier la règle versionnée et sa date d’effet.' },
  { category: 'realEstate', words: ['logement', 'immobilier', 'dpe', 'loyer', 'propriétaire'], why: 'Peut concerner un bien, une location ou un projet immobilier.', action: 'Comparer la règle à la situation du bien.' },
  { category: 'investment', words: ['marché', 'épargne', 'investisseur', 'finance', 'bourse'], why: 'Peut affecter un produit d’épargne ou un risque d’investissement.', action: 'Lire la source sans modifier automatiquement une allocation.' },
  { category: 'credit', words: ['crédit', 'taux', 'banque'], why: 'Peut influencer le coût d’un financement.', action: 'Actualiser les hypothèses de simulation si nécessaire.' },
  { category: 'budget', words: ['prix', 'inflation', 'consommation'], why: 'Peut avoir un effet sur le budget et les dépenses.', action: 'Réviser les hypothèses budgétaires si l’impact est matériel.' }
];

export function classifyNews(items: readonly NormalizedNews[]): NormalizedNews[] {
  return items.map((item) => {
    const haystack = item.title.toLocaleLowerCase('fr-FR');
    const match = rules.find((rule) => rule.words.some((word) => haystack.includes(word)));
    return match === undefined ? item : { ...item, category: match.category, whyItMatters: match.why, possibleAction: match.action };
  });
}
