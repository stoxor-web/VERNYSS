export interface DeclarationHelpRow {
  code: '2DC' | '2TR' | '3VG' | '3VH' | '2OP';
  label: string;
  note: string;
}

export const DECLARATION_HELP: DeclarationHelpRow[] = [
  { code: '2DC', label: 'Revenus des actions et parts', note: 'À rapprocher des dividendes éligibles et de l’IFU.' },
  { code: '2TR', label: 'Produits de placement à revenu fixe', note: 'À rapprocher des intérêts et produits correspondants.' },
  { code: '3VG', label: 'Plus-values mobilières', note: 'À vérifier selon les calculs de cession et l’IFU.' },
  { code: '3VH', label: 'Moins-values mobilières', note: 'À rapprocher des moins-values et reports applicables.' },
  { code: '2OP', label: 'Option pour le barème', note: 'Option globale pour les revenus concernés ; simuler avant de choisir.' }
];

export const DECLARATION_FORMS = ['2042', '2042-C', '2074', '2074-CMV'] as const;
export const DECLARATION_WARNING = 'À comparer avec l’IFU et la déclaration préremplie. Les formulaires réellement nécessaires dépendent de votre situation.';
