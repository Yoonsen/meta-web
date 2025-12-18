import type { NormalizedResult, SearchRequest, SearchResponse } from './types';

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8787';
const useMock = import.meta.env.VITE_API_USE_MOCK === 'true';

export const defaultSources = ['serp', 'openalex', 'arxiv'];

export async function search(request: SearchRequest): Promise<SearchResponse> {
  if (useMock) {
    return mockSearch(request);
  }

  try {
    const res = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw new Error(`API responded with ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.warn('Falling back to mock search', error);
    return mockSearch(request);
  }
}

function mockSearch(request: SearchRequest): SearchResponse {
  const now = Date.now();
  const results: NormalizedResult[] = Array.from({ length: 6 }).map(
    (_, idx) => {
      const rankBoost = Math.max(1, 10 - idx);
      return {
        id: `${request.q}-${idx}`,
        title: `${request.q} — sample finding ${idx + 1}`,
        url: `https://example.com/${encodeURIComponent(request.q)}/${idx + 1}`,
        snippet:
          'Dette er mock-data for å gjøre UIet testbart før backend er på plass.',
        source: request.sources[idx % request.sources.length] || 'mock',
        lang: request.profile.preferredLangs[0] || 'en',
        date: new Date(now - idx * 86_400_000).toISOString().slice(0, 10),
        authors: ['J. Doe', 'A. Researcher'],
        venue: idx % 2 === 0 ? 'OpenAlex' : 'Crossref',
        doi: `10.1234/${idx + 1}`,
        citations: 10 * idx,
        score: rankBoost * 0.1 + (request.profile.mainstreamPenalty ?? 0),
        why: [
          { key: 'lang_match', weight: 0.2, note: 'Matches preferredLangs' },
          { key: 'scholarly', weight: 0.3, note: 'Indexed scholarly source' },
          { key: 'freshness', weight: 0.1, note: 'Recent publication date' },
        ],
      };
    },
  );

  return {
    q: request.q,
    results,
    meta: {
      tookMs: 42,
      perSource: request.sources.reduce<Record<string, { tookMs: number; count: number }>>(
        (acc, src) => {
          acc[src] = { tookMs: 12 + Math.floor(Math.random() * 10), count: 2 };
          return acc;
        },
        {},
      ),
    },
  };
}

