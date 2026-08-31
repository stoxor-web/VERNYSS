import type { NormalizedNews } from './types';

export function deduplicateNews(items: readonly NormalizedNews[]): NormalizedNews[] {
  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  return items.filter((item) => {
    const normalizedTitle = item.title.toLocaleLowerCase('fr-FR').replace(/[^a-zà-ÿ0-9]/gi, '');
    if (seenUrl.has(item.url) || seenTitle.has(normalizedTitle)) return false;
    seenUrl.add(item.url);
    seenTitle.add(normalizedTitle);
    return true;
  });
}
