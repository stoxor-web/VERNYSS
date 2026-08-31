import { createHash } from 'node:crypto';
import type { NormalizedNews, RawNews } from './types';

export function normalizeNews(items: readonly RawNews[]): NormalizedNews[] {
  return items.map((item) => ({
    ...item,
    title: item.title.normalize('NFC').replace(/\s+/g, ' ').trim(),
    id: createHash('sha256').update(item.url).digest('hex').slice(0, 24),
    category: 'administrative',
    score: 0,
    whyItMatters: 'Actualité issue d’une source officielle.',
    possibleAction: 'Lire la source et vérifier si elle concerne votre situation.'
  }));
}
