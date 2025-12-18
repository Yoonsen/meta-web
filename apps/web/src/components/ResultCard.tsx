import type { NormalizedResult } from '../api/types';
import { normalizeDomain } from '../utils/domainRules';
import { highlight } from '../utils/highlight';
import { WhyDrawer } from './WhyDrawer';

type Props = {
  result: NormalizedResult;
  query: string;
};

export function ResultCard({ result, query }: Props) {
  return (
    <article className="result-card">
      <header>
        <a href={result.url} target="_blank" rel="noreferrer">
          <h3>{result.title}</h3>
        </a>
        <div className="meta">
          <span className="source">{result.source}</span>
          <span className="domain">{normalizeDomain(result.url)}</span>
          {result.date && <span>{result.date}</span>}
          {result.venue && <span>{result.venue}</span>}
        </div>
      </header>
      {result.snippet && (
        <p className="snippet">{highlight(result.snippet, query)}</p>
      )}
      <footer className="meta-row">
        {result.authors && result.authors.length > 0 && (
          <span>{result.authors.join(', ')}</span>
        )}
        {result.citations !== undefined && (
          <span>{result.citations} sitater</span>
        )}
        <span className="score">score {result.score.toFixed(2)}</span>
      </footer>
      <WhyDrawer why={result.why} />
    </article>
  );
}

