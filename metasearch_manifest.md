# MetaSearch v0.1 — Manifest & Architecture

Dette dokumentet er ment som **input til Cursor / GPT‑codex** for å generere en fungerende Vite‑app (frontend) med tilhørende backend for en forskningsrettet metasøkemotor.

---

## Mål
- Ett søk → flere kilder → normalisert → deduplisert → re‑rangert.
- Brukerprofiler på tvers av søk (språk, mainstream‑filter, tidsrom, domener).
- Forklarbar rangering (*why this result*).

## Ikke‑mål (v0.1)
- Ingen ML/LTR (kun heuristisk scoring).
- Ingen autentisering (lokale profiler i browser).
- Ingen scraping (kun API‑baserte kilder).

---

## Overordnet arkitektur

```
[ Vite / React ]  --->  [ API / Orchestrator ]  --->  [ Search Providers ]
        |                        |
        |                        +--> Normalize → Dedupe → Rank → Explain
        |
        +--> Profiles / UI state
```

**Prinsipp:** Frontend er helt “dum”. All søkelogikk, nøkler og ToS‑sensitivitet ligger i backend.

---

## Teknologistack (forslag)

### Frontend
- Vite + React + TypeScript
- Zustand (eller tilsvarende lett state)
- Fetch API

### Backend
- Node + Express **eller** FastAPI (Python)
- Async fan‑out / fan‑in
- SQLite (cache) → Redis senere

---

## Mappestruktur

### Frontend
```
apps/web/
  src/
    app/
      SearchPage.tsx
      ResultPage.tsx
      SettingsPage.tsx
    components/
      SearchBar.tsx
      SourcePicker.tsx
      ProfileEditor.tsx
      ResultCard.tsx
      WhyDrawer.tsx
      FiltersBar.tsx
    state/
      store.ts
      profiles.ts
    api/
      client.ts
      types.ts
    utils/
      domainRules.ts
      highlight.ts
```

### Backend
```
apps/api/
  src/
    server.ts
    routes/
      search.ts
    core/
      orchestrator.ts
      normalize.ts
      dedupe.ts
      rank.ts
      explain.ts
      cache.ts
    providers/
      index.ts
      serp.ts
      openalex.ts
      crossref.ts
      arxiv.ts
    config/
      env.ts
    types/
      search.ts
```

---

## Datakilder (Providers)

- **Web**: SerpAPI / Brave Search / tilsvarende (én aggregator er nok i v0.1)
- **Scholarly**:
  - OpenAlex
  - Crossref
  - arXiv
  - (valgfritt) Semantic Scholar

Alle providers implementerer samme grensesnitt.

---

## Provider‑interface (backend)

```ts
type ProviderQuery = {
  q: string;
  page?: number;
  pageSize?: number;
  timeRange?: { from?: string; to?: string };
};

type ProviderResult = {
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

interface Provider {
  id: string;
  search(q: ProviderQuery): Promise<ProviderResult[]>;
}
```

---

## Normalisert resultat

```ts
type NormalizedResult = {
  id: string;           // hash(url|doi|title)
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
  why: Array<{
    key: string;        // e.g. "lang_match", "scholarly", "freshness"
    weight: number;
    note?: string;
  }>;
};
```

---

## Dedup‑strategi

1. DOI‑match (høyest presedens)
2. Normalisert URL
3. Fuzzy title‑match (fallback)

Behold høyest *pre‑score*, slå sammen metadata.

---

## Ranking (heuristisk v0.1)

Lineær kombinasjon:

```
score =
  + w_lang * langPreference
  + w_type * scholarlyBoost
  + w_fresh * recency
  + w_cite * log(citations+1)
  - w_main * mainstreamPenalty
  + w_domain * domainBoost
```

Alle bidrag logges til `why[]`.

---

## Forklarbarhet

Frontend viser:
- total score
- liste over bidrag
- kilde(r) som ga treffet

Dette er eksplisitt et **forskningskrav**, ikke UX‑pynt.

---

## API‑kontrakt

### Request
```ts
type SearchRequest = {
  q: string;
  page?: number;
  pageSize?: number;
  sources: string[];
  profile: {
    preferredLangs: string[];
    excludeLangs?: string[];
    timeRange?: { from?: string; to?: string };
    mainstreamPenalty?: number;   // 0..1
    domain?: {
      boost?: string[];
      block?: string[];
    };
  };
};
```

### Response
```ts
type SearchResponse = {
  q: string;
  results: NormalizedResult[];
  meta: {
    tookMs: number;
    perSource: Record<string, {
      tookMs: number;
      count: number;
      errors?: string[];
    }>;
  };
};
```

---

## Utvidelser (senere)

- Lærte vekter (LTR light)
- Profil‑versjonering
- Eksport (BibTeX / RIS / JSON‑LD)
- Delbare queries (permalinks)
- Institusjonelle presets

---

## Prompt‑hint til GPT‑codex

> “Implementer backend først. Lag rene provider‑adaptere, deretter orchestrator → normalize → dedupe → rank. Frontend kun som tynn klient.”
