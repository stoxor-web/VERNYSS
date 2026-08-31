export interface DpeRentalRule {
  effectiveFrom: string;
  effectiveUntil: string | null;
  prohibitedClasses: readonly string[];
  sourceTitle: string;
  sourceUrl: string;
  verifiedAt: string;
}

export const DPE_RENTAL_RULES: DpeRentalRule[] = [
  {
    effectiveFrom: '2025-01-01',
    effectiveUntil: '2027-12-31',
    prohibitedClasses: ['G'],
    sourceTitle: 'Décence énergétique et mise en location — Service-Public.fr',
    sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F2042',
    verifiedAt: '2026-08-31'
  },
  {
    effectiveFrom: '2028-01-01',
    effectiveUntil: '2033-12-31',
    prohibitedClasses: ['F', 'G'],
    sourceTitle: 'Décence énergétique et mise en location — Service-Public.fr',
    sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F2042',
    verifiedAt: '2026-08-31'
  },
  {
    effectiveFrom: '2034-01-01',
    effectiveUntil: null,
    prohibitedClasses: ['E', 'F', 'G'],
    sourceTitle: 'Décence énergétique et mise en location — Service-Public.fr',
    sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F2042',
    verifiedAt: '2026-08-31'
  }
];

export function dpeRentalStatus(dpeClass: string, onDate: Date) {
  const iso = onDate.toISOString().slice(0, 10);
  const rule = DPE_RENTAL_RULES.find((candidate) => candidate.effectiveFrom <= iso && (candidate.effectiveUntil === null || candidate.effectiveUntil >= iso));
  if (rule === undefined) return { status: 'confirm' as const, message: 'À confirmer : aucune règle versionnée ne couvre cette date.' };
  if (!['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(dpeClass)) return { status: 'confirm' as const, message: 'Classe DPE inconnue. À confirmer.' };
  return rule.prohibitedClasses.includes(dpeClass)
    ? { status: 'restricted' as const, message: `Classe ${dpeClass} concernée par la règle versionnée à cette date. Vérifier les conditions et exceptions sur la source officielle.`, rule }
    : { status: 'notRestrictedByThisRule' as const, message: `Classe ${dpeClass} non interdite par cette règle versionnée à cette date. D’autres exigences peuvent s’appliquer.`, rule };
}
