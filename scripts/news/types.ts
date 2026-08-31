export type NewsCategory = 'tax' | 'investment' | 'budget' | 'salary' | 'realEstate' | 'credit' | 'cash' | 'risk' | 'administrative';

export interface NewsSource {
  name: string;
  homeUrl: string;
  listingUrl: string;
  official: true;
}

export interface RawNews {
  sourceName: string;
  sourceUrl: string;
  title: string;
  url: string;
  fetchedAt: string;
}

export interface NormalizedNews extends RawNews {
  id: string;
  category: NewsCategory;
  score: number;
  whyItMatters: string;
  possibleAction: string;
}
