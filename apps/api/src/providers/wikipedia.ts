import type { Provider, ProviderQuery, ProviderResult } from '../types/search.js';

const BASE = 'https://en.wikipedia.org';

export const wikipediaProvider: Provider = {
  id: 'wikipedia',
  async search(query: ProviderQuery): Promise<ProviderResult[]> {
    const pageSize = query.pageSize ?? 10;
    const url = `${BASE}/w/rest.php/v1/search/title?q=${encodeURIComponent(query.q)}&limit=${pageSize}`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`Wikipedia responded with ${res.status}`);
    }

    const data = (await res.json()) as any;
    const pages = Array.isArray(data?.pages) ? data.pages : [];

    return pages.map((page: any): ProviderResult => {
      const title = page.title as string;
      const url = `${BASE}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

      return {
        title,
        url,
        snippet: page.description ?? page.excerpt,
        lang: 'en',
        date: page.timestamp ?? page?.updated ?? undefined,
        authors: undefined,
        venue: 'Wikipedia',
        doi: undefined,
        citations: undefined,
        rawScore: page.score ?? 0,
      };
    });
  },
};

