export type ProviderQuery = {
  q: string;
  page?: number;
  pageSize?: number;
  timeRange?: { from?: string; to?: string };
};

export type ProviderResult = {
  title: string;
  url: string;
  snippet?: string;
  lang?: string;
  date?: string;
  authors?: string[];
  venue?: string;
  doi?: string;
  citations?: number;
  rawScore?: number;
};

export interface Provider {
  id: string;
  search(q: ProviderQuery): Promise<ProviderResult[]>;
}

export type WhyEntry = {
  key: string; // e.g. "lang_match", "scholarly", "freshness"
  weight: number;
  note?: string;
};

export type NormalizedResult = {
  id: string; // hash(url|doi|title)
  title: string;
  url: string;
  snippet?: string;
  source: string;
  lang?: string;
  date?: string;
  authors?: string[];
  venue?: string;
  doi?: string;
  citations?: number;
  score: number;
  why: WhyEntry[];
};

export type Profile = {
  preferredLangs: string[];
  excludeLangs?: string[];
  timeRange?: { from?: string; to?: string };
  mainstreamPenalty?: number; // 0..1
  domain?: {
    boost?: string[];
    block?: string[];
  };
};

export type SearchRequest = {
  q: string;
  page?: number;
  pageSize?: number;
  sources: string[];
  profile: Profile;
};

export type SearchResponse = {
  q: string;
  results: NormalizedResult[];
  meta: {
    tookMs: number;
    perSource: Record<
      string,
      {
        tookMs: number;
        count: number;
        errors?: string[];
      }
    >;
  };
};

