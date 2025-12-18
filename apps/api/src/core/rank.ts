import type { NormalizedResult, Profile, WhyEntry } from '../types/search.js';

const MAINSTREAM_DOMAINS = ['.com', '.co', '.tv'];
const SCHOLARLY_SOURCES = new Set(['arxiv', 'semanticscholar']);

export function rankResults(results: NormalizedResult[], profile: Profile): NormalizedResult[] {
  return results
    .map((result) => applyHeuristics(result, profile))
    .sort((a, b) => b.score - a.score);
}

function applyHeuristics(result: NormalizedResult, profile: Profile): NormalizedResult {
  let score = 0;
  const why: WhyEntry[] = [];
  const domain = getDomain(result.url);

  // Language preference / exclusion
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

  // Scholarly boost
  if (SCHOLARLY_SOURCES.has(result.source)) {
    const weight = 0.25;
    score += weight;
    why.push({ key: 'scholarly', weight, note: result.source });
  }

  // Recency
  const recency = computeRecency(result.date);
  if (recency > 0) {
    const weight = 0.2 * recency;
    score += weight;
    why.push({ key: 'freshness', weight, note: result.date });
  }

  // Citations
  if (typeof result.citations === 'number') {
    const contrib = Math.min(1, Math.log1p(result.citations) / 5) * 0.25;
    score += contrib;
    why.push({ key: 'citations', weight: contrib, note: `${result.citations}` });
  }

  // Domain boost/block
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

  // Mainstream penalty
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
  const recency = 1 - Math.min(1, years / 10); // decay over 10 years
  return Math.max(0, recency);
}

