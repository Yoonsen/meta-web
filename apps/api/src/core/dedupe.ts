import type { NormalizedResult } from '../types/search.js';

export function dedupeResults(results: NormalizedResult[]): NormalizedResult[] {
  const seen = new Map<string, NormalizedResult>();

  for (const result of results) {
    const key = makeKey(result);
    const existing = key ? seen.get(key) : undefined;

    if (!existing) {
      if (key) seen.set(key, result);
      continue;
    }

    // Prefer entry with more citations, else keep existing.
    const better =
      (result.citations ?? 0) > (existing.citations ?? 0) ? result : existing;

    existing.title = better.title || existing.title;
    existing.url = better.url || existing.url;
    existing.snippet = existing.snippet ?? better.snippet;
    existing.authors = existing.authors?.length ? existing.authors : better.authors;
    existing.venue = existing.venue ?? better.venue;
    existing.date = existing.date ?? better.date;
    existing.doi = existing.doi ?? better.doi;
    existing.citations = Math.max(existing.citations ?? 0, better.citations ?? 0);
    existing.score = Math.max(existing.score, better.score);
    existing.why = existing.why.length ? existing.why : better.why;
  }

  return Array.from(seen.values());
}

function makeKey(r: NormalizedResult): string | undefined {
  if (r.doi) return `doi:${r.doi.toLowerCase()}`;
  const urlKey = normalizeUrl(r.url);
  if (urlKey) return `url:${urlKey}`;
  if (r.title) return `title:${r.title.toLowerCase().trim()}`;
  return undefined;
}

function normalizeUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    const path = u.pathname.replace(/\/+$/, '');
    return `${u.hostname.toLowerCase()}${path}`;
  } catch {
    return raw.toLowerCase();
  }
}

