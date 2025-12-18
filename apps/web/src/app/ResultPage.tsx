import type { NormalizedResult, SearchResponse } from '../api/types';
import { ResultCard } from '../components/ResultCard';

type Props = {
  results: NormalizedResult[];
  status: 'idle' | 'loading' | 'error' | 'success';
  error?: string;
  meta?: SearchResponse['meta'];
  query: string;
};

export function ResultPage({ results, status, error, meta, query }: Props) {
  if (status === 'idle') {
    return <p className="muted">Skriv et søk for å komme i gang.</p>;
  }

  if (status === 'loading') {
    return <p>Henter resultater…</p>;
  }

  if (status === 'error') {
    return <p className="error">Noe gikk galt: {error}</p>;
  }

  if (!results.length) {
    return <p className="muted">Ingen treff (prøv flere kilder eller annet søk).</p>;
  }

  return (
    <div className="results">
      {meta && (
        <div className="meta-row">
          <span>{meta.tookMs} ms total</span>
          <span>
            {Object.entries(meta.perSource)
              .map(([key, info]) => `${key}: ${info.count} (${info.tookMs}ms)`)
              .join(' · ')}
          </span>
        </div>
      )}
      {results.map((result) => (
        <ResultCard key={result.id} result={result} query={query} />
      ))}
    </div>
  );
}

