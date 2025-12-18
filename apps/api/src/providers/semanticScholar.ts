import { env } from '../config/env.js';
import type { Provider, ProviderQuery, ProviderResult } from '../types/search.js';

const BASE = 'https://api.semanticscholar.org/graph/v1';

export const semanticScholarProvider: Provider = {
  id: 'semanticscholar',
  async search(query: ProviderQuery): Promise<ProviderResult[]> {
    const pageSize = query.pageSize ?? 5;
    const url = `${BASE}/paper/search?query=${encodeURIComponent(
      query.q,
    )}&limit=${pageSize}&fields=title,url,abstract,venue,authors.name,externalIds,publicationDate,citationCount,year,isOpenAccess`;

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (env.semanticScholarKey) {
      headers['x-api-key'] = env.semanticScholarKey;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      // Allow anonymous access: silently drop unauthorized/limited responses.
      if ([401, 403, 429].includes(res.status)) return [];
      throw new Error(`Semantic Scholar responded with ${res.status}`);
    }

    const data = (await res.json()) as any;
    const papers = Array.isArray(data?.data) ? data.data : [];

    return papers.map((paper: any): ProviderResult => {
      const doi = paper.externalIds?.DOI ?? paper.externalIds?.ArXiv;
      return {
        title: paper.title ?? 'Untitled',
        url: paper.url ?? (doi ? `https://doi.org/${doi}` : undefined) ?? '',
        snippet: paper.abstract,
        lang: 'en',
        date: paper.publicationDate ?? (paper.year ? `${paper.year}-01-01` : undefined),
        authors: Array.isArray(paper.authors)
          ? paper.authors.map((a: any) => a.name).filter(Boolean)
          : [],
        venue: paper.venue,
        doi,
        citations: paper.citationCount,
        rawScore: paper.isOpenAccess ? 0.2 : 0,
      };
    });
  },
};

