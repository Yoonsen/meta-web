import { XMLParser } from 'fast-xml-parser';
import { env } from '../config/env.js';
import type { Provider, ProviderQuery, ProviderResult } from '../types/search.js';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

export const arxivProvider: Provider = {
  id: 'arxiv',
  async search(query: ProviderQuery): Promise<ProviderResult[]> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const start = (page - 1) * pageSize;

    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
      query.q,
    )}&start=${start}&max_results=${pageSize}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': env.userAgent },
    });

    if (!res.ok) {
      throw new Error(`arXiv responded with ${res.status}`);
    }

    const xml = await res.text();
    const data = parser.parse(xml);
    const entries = Array.isArray(data?.feed?.entry)
      ? data.feed.entry
      : data?.feed?.entry
        ? [data.feed.entry]
        : [];

    return entries.map((entry: any): ProviderResult => {
      const authors = entry.author
        ? Array.isArray(entry.author)
          ? entry.author.map((a: any) => a.name).filter(Boolean)
          : [entry.author.name].filter(Boolean)
        : [];

      const doi = entry['arxiv:doi'] ?? entry.doi;
      const link =
        Array.isArray(entry.link) && entry.link.length
          ? entry.link[0]['@_href'] ?? entry.link[0].href ?? entry.id
          : entry.id;

      return {
        title: entry.title?.trim() ?? 'Untitled',
        url: link,
        snippet: entry.summary,
        lang: 'en',
        date: entry.published,
        authors,
        venue: 'arXiv',
        doi,
        citations: undefined,
        rawScore: entry['arxiv:comment'] ? 0.1 : 0,
      };
    });
  },
};

