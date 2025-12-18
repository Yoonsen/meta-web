import { create } from 'zustand';
import { search, defaultSources } from '../api/client';
import type {
  NormalizedResult,
  Profile,
  SearchRequest,
  SearchResponse,
} from '../api/types';
import { defaultProfile, mergeProfile } from './profiles';

type SearchStatus = 'idle' | 'loading' | 'error' | 'success';

type SearchStore = {
  query: string;
  sources: string[];
  profile: Profile;
  results: NormalizedResult[];
  meta?: SearchResponse['meta'];
  status: SearchStatus;
  error?: string;
  setQuery: (q: string) => void;
  setSources: (sources: string[]) => void;
  updateProfile: (partial: Partial<Profile>) => void;
  resetProfile: () => void;
  runSearch: () => Promise<void>;
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  sources: defaultSources,
  profile: defaultProfile,
  results: [],
  meta: undefined,
  status: 'idle',
  error: undefined,

  setQuery: (q) => set({ query: q }),

  setSources: (sources) =>
    set({
      sources: Array.from(new Set(sources)).filter(Boolean),
    }),

  updateProfile: (partial) =>
    set((state) => ({
      profile: mergeProfile(state.profile, partial),
    })),

  resetProfile: () => set({ profile: defaultProfile }),

  runSearch: async () => {
    const { query, sources, profile } = get();
    if (!query.trim()) return;

    set({ status: 'loading', error: undefined });

    try {
      const payload: SearchRequest = {
        q: query.trim(),
        page: 1,
        pageSize: 20,
        sources,
        profile,
      };

      const response = await search(payload);
      set({
        results: response.results,
        meta: response.meta,
        status: 'success',
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Ukjent feil',
      });
    }
  },
}));

