import type { NewsSource, RawNews } from './types';

export const SOURCES: NewsSource[] = [
  { name: 'impots.gouv.fr', homeUrl: 'https://www.impots.gouv.fr', listingUrl: 'https://www.impots.gouv.fr/actualite', official: true },
  { name: 'Service-Public.fr', homeUrl: 'https://www.service-public.fr', listingUrl: 'https://www.service-public.fr/particuliers/actualites', official: true },
  { name: 'economie.gouv.fr', homeUrl: 'https://www.economie.gouv.fr', listingUrl: 'https://www.economie.gouv.fr/actualites', official: true },
  { name: 'AMF', homeUrl: 'https://www.amf-france.org', listingUrl: 'https://www.amf-france.org/fr/actualites-publications/actualites', official: true },
  { name: 'Banque de France', homeUrl: 'https://www.banque-france.fr', listingUrl: 'https://www.banque-france.fr/fr/actualites', official: true },
  { name: 'INSEE', homeUrl: 'https://www.insee.fr', listingUrl: 'https://www.insee.fr/fr/information/2108548', official: true },
  { name: 'ANIL', homeUrl: 'https://www.anil.org', listingUrl: 'https://www.anil.org/aj-actualites/', official: true },
  { name: 'ADEME', homeUrl: 'https://www.ademe.fr', listingUrl: 'https://www.ademe.fr/presse/communiques-de-presse/', official: true },
  { name: 'data.gouv.fr', homeUrl: 'https://www.data.gouv.fr', listingUrl: 'https://www.data.gouv.fr/fr/datasets/', official: true },
  { name: 'BCE', homeUrl: 'https://www.ecb.europa.eu', listingUrl: 'https://www.ecb.europa.eu/press/html/index.fr.html', official: true },
  { name: 'Eurostat', homeUrl: 'https://ec.europa.eu/eurostat', listingUrl: 'https://ec.europa.eu/eurostat/web/main/news', official: true }
];

const MAX_BYTES = 1_000_000;
const LINK_RE = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

function plainText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

async function robotsAllows(source: NewsSource): Promise<boolean> {
  try {
    const url = new URL('/robots.txt', source.homeUrl);
    const response = await fetch(url, { headers: { 'User-Agent': 'PrivateFinanceOS-NewsBot/0.1 (+non-commercial; official sources only)' }, signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return true;
    const text = await response.text();
    const targetPath = new URL(source.listingUrl).pathname;
    let applies = false;
    for (const rawLine of text.split('\n')) {
      const line = rawLine.split('#')[0]?.trim() ?? '';
      const [rawKey, ...rest] = line.split(':');
      const key = rawKey?.trim().toLowerCase();
      const value = rest.join(':').trim();
      if (key === 'user-agent') applies = value === '*';
      if (applies && key === 'disallow' && value !== '' && targetPath.startsWith(value)) return false;
    }
    return true;
  } catch (error: unknown) {
    console.error(`robots.txt check failed for ${source.name}: ${error instanceof Error ? error.name : 'unknown'}`);
    return false;
  }
}

export async function fetchSource(source: NewsSource): Promise<RawNews[]> {
  if (!(await robotsAllows(source))) return [];
  const response = await fetch(source.listingUrl, { headers: { 'User-Agent': 'PrivateFinanceOS-NewsBot/0.1 (+non-commercial; official sources only)', Accept: 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BYTES) throw new Error(`${source.name}: réponse trop volumineuse`);
  const html = (await response.text()).slice(0, MAX_BYTES);
  const host = new URL(source.homeUrl).hostname;
  const found = new Map<string, RawNews>();
  for (const match of html.matchAll(LINK_RE)) {
    const href = match[1];
    const body = match[2];
    if (href === undefined || body === undefined) continue;
    const title = plainText(body);
    if (title.length < 25 || title.length > 240) continue;
    let resolved: URL;
    try { resolved = new URL(href, source.listingUrl); } catch (error: unknown) { void error; continue; }
    if (resolved.protocol !== 'https:' || resolved.hostname !== host) continue;
    resolved.hash = '';
    const url = resolved.toString();
    if (found.has(url)) continue;
    found.set(url, { sourceName: source.name, sourceUrl: source.homeUrl, title, url, fetchedAt: new Date().toISOString() });
    if (found.size >= 20) break;
  }
  return [...found.values()];
}

export async function fetchAllSources(): Promise<RawNews[]> {
  const results = await Promise.allSettled(SOURCES.map(fetchSource));
  return results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
}
