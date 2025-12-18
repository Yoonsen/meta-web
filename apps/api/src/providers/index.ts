import { arxivProvider } from './arxiv.js';
import { semanticScholarProvider } from './semanticScholar.js';
import { wikipediaProvider } from './wikipedia.js';
import type { Provider } from '../types/search.js';

export const providers: Record<string, Provider> = {
  arxiv: arxivProvider,
  wikipedia: wikipediaProvider,
  semanticscholar: semanticScholarProvider,
};

export const defaultSources = Object.keys(providers);

