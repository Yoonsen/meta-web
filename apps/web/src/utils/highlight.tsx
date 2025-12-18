import { Fragment, type ReactNode } from 'react';

export function highlight(text: string, query: string): ReactNode {
  if (!text || !query) return text;

  const terms = query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (!terms.length) return text;

  const pattern = new RegExp(`(${terms.map(escapeRegex).join('|')})`, 'gi');
  const detector = new RegExp(pattern.source, 'i');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, idx) =>
        detector.test(part) ? (
          <mark key={idx}>{part}</mark>
        ) : (
          <Fragment key={idx}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

