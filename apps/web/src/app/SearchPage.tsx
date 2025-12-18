import { useSearchStore } from '../state/store';
import { SearchBar } from '../components/SearchBar';
import { SourcePicker } from '../components/SourcePicker';
import { FiltersBar } from '../components/FiltersBar';
import { ProfileEditor } from '../components/ProfileEditor';
import { ResultPage } from './ResultPage';
import { defaultSources } from '../api/client';

export function SearchPage() {
  const {
    query,
    setQuery,
    runSearch,
    sources,
    setSources,
    profile,
    updateProfile,
    resetProfile,
    results,
    meta,
    status,
    error,
  } = useSearchStore();

  return (
    <div className="layout">
      <header className="hero">
        <div>
          <p className="eyebrow">Meta‑web v0.1</p>
          <h1>Metasøk for web + scholarly</h1>
          <p className="muted">
            Frontend er tynn; all logikk ligger i backend. Denne klienten holder
            profiler, kilder og viser forklaringer.
          </p>
        </div>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={runSearch}
          placeholder="LLM alignment, infodemics, open access ..."
        />
        <FiltersBar profile={profile} onChange={updateProfile} />
        <SourcePicker
          availableSources={defaultSources}
          selected={sources}
          onChange={setSources}
        />
      </header>

      <main className="content">
        <section className="primary">
          <ResultPage
            results={results}
            status={status}
            error={error}
            meta={meta}
            query={query}
          />
        </section>
        <aside className="sidebar">
          <ProfileEditor
            profile={profile}
            onChange={updateProfile}
            onReset={resetProfile}
          />
        </aside>
      </main>
    </div>
  );
}

