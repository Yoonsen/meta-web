import { dedupeResults } from './dedupe.js';
import { normalizeResults } from './normalize.js';
import { rankResults } from './rank.js';
import { defaultSources, providers } from '../providers/index.js';
import type { NormalizedResult, SearchRequest, SearchResponse } from '../types/search.js';

export async function runSearch(request: SearchRequest): Promise<SearchResponse> {
  const sources =
    request.sources?.length > 0
      ? request.sources.filter((s: string) => providers[s])
      : defaultSources;

  if (!sources.length) {
    throw new Error('No valid sources selected');
  }

  const t0 = Date.now();
  const perSource: Record<string, { tookMs: number; count: number; errors?: string[] }> = {};
  const collected: NormalizedResult[] = [];

  await Promise.all(
    sources.map(async (source: string) => {
      const provider = providers[source];
      const start = Date.now();
      try {
        const providerResults = await provider.search({
          q: request.q,
          page: request.page,
          pageSize: request.pageSize,
          timeRange: request.profile.timeRange,
        });
        const normalized = normalizeResults(source, providerResults);
        collected.push(...normalized);
        perSource[source] = { tookMs: Date.now() - start, count: normalized.length };
      } catch (error) {
        perSource[source] = {
          tookMs: Date.now() - start,
          count: 0,
          errors: [error instanceof Error ? error.message : 'unknown error'],
        };
      }
    }),
  );

  const deduped = dedupeResults(collected);
  const ranked = rankResults(deduped, request.profile);

  return {
    q: request.q,
    results: ranked,
    meta: {
      tookMs: Date.now() - t0,
      perSource,
    },
  };
}

