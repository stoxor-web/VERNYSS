import { classifyNews } from './classifyNews';
import { deduplicateNews } from './deduplicateNews';
import { fetchAllSources } from './fetchSources';
import { normalizeNews } from './normalizeNews';
import { publishNews } from './publishNews';
import { scoreNews } from './scoreNews';

const raw = await fetchAllSources();
const normalized = normalizeNews(raw);
const deduplicated = deduplicateNews(normalized);
const classified = classifyNews(deduplicated);
const scored = scoreNews(classified);
await publishNews(scored);
console.info(`News pipeline: ${scored.length} éléments officiels publiés.`);
