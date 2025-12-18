# Logbook

## 2025-12-18
- Scaffoldet Vite/React/TS i `apps/web`, la til Zustand og UI-stubber iht. manifest.
- La til GH Pages-build (`npm run build:docs`) og deploy-klare `docs/`.
- Bygget backend i `apps/api` (Express/TS) med providers: arXiv, Wikipedia, Semantic Scholar (key optional, anon ok men ofte tomt).
- Lagt til direct mode i frontend som kaller åpne APIer fra browser; fallback til mock/feilhåndtering.
- Testet `/api/search` lokalt: arXiv ga treff, Wikipedia 429, Semantic Scholar tom uten key.
- Commits: `chore: scaffold meta-web frontend for gh pages`, `feat: add arxiv/wikipedia backend search`, `chore: allow semantic scholar without api key`, `feat: add direct-mode search for gh-pages`.


