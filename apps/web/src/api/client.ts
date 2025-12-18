import type {
  NormalizedResult,
  ProviderResult,
  Profile,
  SearchRequest,
  SearchResponse,
  WhyEntry,
} from './types';

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8787';
const useMock = import.meta.env.VITE_API_USE_MOCK === 'true';
const directMode =
  import.meta.env.VITE_DIRECT_MODE === 'true' ||
  (!import.meta.env.VITE_API_URL && import.meta.env.VITE_DIRECT_MODE !== 'false');
const semanticKey = import.meta.env.VITE_SEMANTIC_SCHOLAR_KEY;

export const defaultSources = ['arxiv', 'wikipedia', 'semanticscholar'];

export async function search(request: SearchRequest): Promise<SearchResponse> {
  const sources = request.sources?.length ? request.sources : defaultSources;
  const req = { ...request, sources };

  if (useMock) {
    return mockSearch(req);
  }

  if (directMode) {
    try {
      return await directSearch(req);
    } catch (error) {
      console.warn('Direct search failed, falling back to mock', error);
      return mockSearch(req);
    }
  }

  try {
    return await backendSearch(req);
  } catch (error) {
    console.warn('Backend search failed, attempting direct/mock', error);
    if (directMode || !import.meta.env.VITE_API_URL) {
      try {
        return await directSearch(req);
      } catch (inner) {
        console.warn('Direct search also failed, using mock', inner);
      }
    }
    return mockSearch(req);
  }
}

async function backendSearch(request: SearchRequest): Promise<SearchResponse> {
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
}

async function directSearch(request: SearchRequest): Promise<SearchResponse> {
  const t0 = Date.now();
  const perSource: SearchResponse['meta']['perSource'] = {};
  const collected: NormalizedResult[] = [];
  const sources = request.sources?.length ? request.sources : defaultSources;

  await Promise.all(
    sources.map(async (source) => {
      const start = Date.now();
      try {
        const providerResults = await runProvider(source, request);
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
    meta: { tookMs: Date.now() - t0, perSource },
  };
}

async function runProvider(source: string, request: SearchRequest): Promise<ProviderResult[]> {
  switch (source) {
    case 'wikipedia':
      return searchWikipedia(request);
    case 'semanticscholar':
      return searchSemanticScholar(request);
    case 'arxiv':
      return searchArxiv(request);
    default:
      return [];
  }
}

async function searchWikipedia(request: SearchRequest): Promise<ProviderResult[]> {
  const pageSize = request.pageSize ?? 10;
  const url = `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(
    request.q,
  )}&limit=${pageSize}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Wikipedia responded with ${res.status}`);
  }

  const data = (await res.json()) as any;
  const pages = Array.isArray(data?.pages) ? data.pages : [];

  return pages.map((page: any): ProviderResult => {
    const title = page.title as string;
    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
    return {
      title,
      url,
      snippet: page.description ?? page.excerpt,
      lang: 'en',
      date: page.timestamp ?? page.updated ?? undefined,
      authors: undefined,
      venue: 'Wikipedia',
      doi: undefined,
      citations: undefined,
      rawScore: page.score ?? 0,
    };
  });
}

async function searchSemanticScholar(request: SearchRequest): Promise<ProviderResult[]> {
  const pageSize = request.pageSize ?? 5;
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
    request.q,
  )}&limit=${pageSize}&fields=title,url,abstract,venue,authors.name,externalIds,publicationDate,citationCount,year,isOpenAccess`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (semanticKey) {
    headers['x-api-key'] = semanticKey;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
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
}

async function searchArxiv(request: SearchRequest): Promise<ProviderResult[]> {
  const page = request.page ?? 1;
  const pageSize = request.pageSize ?? 10;
  const start = (page - 1) * pageSize;

  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
    request.q,
  )}&start=${start}&max_results=${pageSize}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'meta-web/0.1 (+https://example.com)' },
  });

  if (!res.ok) {
    // CORS or rate limits may fail; return empty quietly
    if ([401, 403, 429].includes(res.status)) return [];
    throw new Error(`arXiv responded with ${res.status}`);
  }

  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const entries = Array.from(doc.getElementsByTagName('entry'));

  return entries.map((entry): ProviderResult => {
    const title = entry.getElementsByTagName('title')[0]?.textContent?.trim() ?? 'Untitled';
    const link =
      entry.getElementsByTagName('id')[0]?.textContent ??
      entry.getElementsByTagName('link')[0]?.getAttribute('href') ??
      '';
    const summary = entry.getElementsByTagName('summary')[0]?.textContent ?? undefined;
    const published = entry.getElementsByTagName('published')[0]?.textContent ?? undefined;
    const authors = Array.from(entry.getElementsByTagName('author'))
      .map((a) => a.getElementsByTagName('name')[0]?.textContent)
      .filter(Boolean) as string[];
    const doi =
      entry.getElementsByTagName('arxiv:doi')[0]?.textContent ??
      entry.getElementsByTagName('doi')[0]?.textContent ??
      undefined;

    return {
      title,
      url: link,
      snippet: summary,
      lang: 'en',
      date: published,
      authors,
      venue: 'arXiv',
      doi,
      citations: undefined,
      rawScore: 0,
    };
  });
}

function normalizeResults(source: string, results: ProviderResult[]): NormalizedResult[] {
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
  const key = r.doi ?? r.url ?? r.title ?? Math.random().toString(36);
  return simpleHash(key);
}

function dedupeResults(results: NormalizedResult[]): NormalizedResult[] {
  const seen = new Map<string, NormalizedResult>();

  for (const result of results) {
    const key = dedupeKey(result);
    const existing = key ? seen.get(key) : undefined;

    if (!existing) {
      if (key) seen.set(key, result);
      continue;
    }

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

function dedupeKey(r: NormalizedResult): string | undefined {
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

function rankResults(results: NormalizedResult[], profile: Profile): NormalizedResult[] {
  return results
    .map((result) => applyHeuristics(result, profile))
    .sort((a, b) => b.score - a.score);
}

function applyHeuristics(result: NormalizedResult, profile: Profile): NormalizedResult {
  let score = 0;
  const why: WhyEntry[] = [];
  const domain = getDomain(result.url);
  const MAINSTREAM_DOMAINS = ['.com', '.co', '.tv'];
  const SCHOLARLY_SOURCES = new Set(['arxiv', 'semanticscholar']);

  if (result.lang) {
    if (profile.preferredLangs?.includes(result.lang)) {
      const weight = 0.3;
      score += weight;
      why.push({ key: 'lang_match', weight, note: result.lang });
    }
    if (profile.excludeLangs?.includes(result.lang)) {
      const weight = -0.4;
      score += weight;
      why.push({ key: 'lang_excluded', weight, note: result.lang });
    }
  }

  if (SCHOLARLY_SOURCES.has(result.source)) {
    const weight = 0.25;
    score += weight;
    why.push({ key: 'scholarly', weight, note: result.source });
  }

  const recency = computeRecency(result.date);
  if (recency > 0) {
    const weight = 0.2 * recency;
    score += weight;
    why.push({ key: 'freshness', weight, note: result.date });
  }

  if (typeof result.citations === 'number') {
    const contrib = Math.min(1, Math.log1p(result.citations) / 5) * 0.25;
    score += contrib;
    why.push({ key: 'citations', weight: contrib, note: `${result.citations}` });
  }

  if (domain) {
    if (matches(domain, profile.domain?.boost)) {
      const weight = 0.2;
      score += weight;
      why.push({ key: 'domain_boost', weight, note: domain });
    }
    if (matches(domain, profile.domain?.block)) {
      const weight = -0.5;
      score += weight;
      why.push({ key: 'domain_block', weight, note: domain });
    }
  }

  if (domain && MAINSTREAM_DOMAINS.some((suf) => domain.endsWith(suf))) {
    const penalty = (profile.mainstreamPenalty ?? 0) * 0.3;
    if (penalty) {
      score -= penalty;
      why.push({ key: 'mainstream_penalty', weight: -penalty, note: domain });
    }
  }

  return { ...result, score, why };
}

function getDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function matches(domain: string, list?: string[]): boolean {
  if (!list?.length) return false;
  return list.some((suffix) => domain.endsWith(suffix));
}

function computeRecency(date?: string): number {
  if (!date) return 0;
  const ts = Date.parse(date);
  if (Number.isNaN(ts)) return 0;
  const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  const years = days / 365;
  const recency = 1 - Math.min(1, years / 10);
  return Math.max(0, recency);
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(31, hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return `h${(hash >>> 0).toString(16)}`;
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

