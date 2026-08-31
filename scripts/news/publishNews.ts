import type { NormalizedNews } from './types';

function firestoreValue(value: string | number) {
  return typeof value === 'number' ? { integerValue: String(Math.trunc(value)) } : { stringValue: value };
}

export async function publishNews(items: readonly NormalizedNews[]): Promise<void> {
  const projectId = process.env['FIREBASE_PROJECT_ID'];
  const accessToken = process.env['ACCESS_TOKEN'];
  if (!projectId || !accessToken) throw new Error('FIREBASE_PROJECT_ID et ACCESS_TOKEN sont requis pour publier les actualités.');
  for (const item of items) {
    const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/publicContent/news/items/${item.id}`;
    const body = {
      fields: {
        id: firestoreValue(item.id), title: firestoreValue(item.title), url: firestoreValue(item.url), sourceName: firestoreValue(item.sourceName), sourceUrl: firestoreValue(item.sourceUrl),
        category: firestoreValue(item.category), score: firestoreValue(item.score), whyItMatters: firestoreValue(item.whyItMatters), possibleAction: firestoreValue(item.possibleAction), fetchedAt: { timestampValue: item.fetchedAt }
      }
    };
    const response = await fetch(endpoint, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Publication Firestore refusée (${response.status}) pour ${item.id}.`);
  }
}
