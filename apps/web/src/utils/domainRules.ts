const MAINSTREAM_DOMAINS = ['.com', '.co', '.tv'];

export function isMainstream(url: string): boolean {
  return MAINSTREAM_DOMAINS.some((suffix) => url.endsWith(suffix));
}

export function normalizeDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function matchesBoost(domain: string, boostList?: string[]): boolean {
  if (!boostList?.length) return false;
  return boostList.some((suffix) => domain.endsWith(suffix));
}

export function matchesBlock(domain: string, blockList?: string[]): boolean {
  if (!blockList?.length) return false;
  return blockList.some((suffix) => domain.endsWith(suffix));
}

