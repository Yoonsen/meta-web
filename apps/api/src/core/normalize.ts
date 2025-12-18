import crypto from 'node:crypto';
import type { NormalizedResult, ProviderResult } from '../types/search.js';

export function normalizeResults(source: string, results: ProviderResult[]): NormalizedResult[] {
  return results.map((r) => ({
    id: makeId(r),
    title: r.title,
    url: r.url,
    snippet: r.snippet,
    source,
    lang: r.lang,
    date: r.date,
    authors: r.authors,
    venue: r.venue,
    doi: r.doi,
    citations: r.citations,
    score: 0,
    why: [],
  }));
}

function makeId(r: ProviderResult): string {
  const key = r.doi ?? r.url ?? r.title;
  return crypto.createHash('sha1').update(key ?? '').digest('hex');
}

