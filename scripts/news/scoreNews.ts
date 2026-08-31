import type { NormalizedNews } from './types';

const categoryWeight: Record<NormalizedNews['category'], number> = { tax: 5, realEstate: 4, investment: 4, credit: 3, budget: 3, salary: 3, cash: 2, risk: 4, administrative: 1 };

export function scoreNews(items: readonly NormalizedNews[]): NormalizedNews[] {
  return items.map((item) => ({ ...item, score: categoryWeight[item.category] + (item.sourceName.includes('impots') || item.sourceName.includes('Service-Public') ? 2 : 1) })).sort((a, b) => b.score - a.score).slice(0, 60);
}
