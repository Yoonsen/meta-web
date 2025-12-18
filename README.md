# Meta Web (v0.1)

Metasøk-klient for web + scholarly kilder. Kan kjøre rent statisk (direct mode) eller mot en liten Express-backend. GitHub Pages bruker `docs/` som output.

## Kjappstart (frontend)
```bash
cd apps/web
npm install
npm run dev          # local dev (direct mode default hvis VITE_API_URL ikke er satt)
npm run build:docs   # bygger til ../../docs for GitHub Pages
```

### Konfig (frontend)
- `VITE_API_URL` (valgfri): peker til backend `/api/search`. Sett også `VITE_DIRECT_MODE=false` hvis du vil tvinge backend.
- `VITE_DIRECT_MODE` (true/false): direct = kall kilder fra browser. Default true når `VITE_API_URL` er tom.
- `VITE_API_USE_MOCK` (true/false): tvang til mock-data.
- `VITE_SEMANTIC_SCHOLAR_KEY` (valgfri): bedre treff fra Semantic Scholar.

Kilder i direct mode:
- arXiv (kan bli CORS-blokkert i browser; fungerer via backend)
- Wikipedia (kan 429 rate-limit)
- Semantic Scholar (fungerer best med key; uten key kan gi tomt svar)

## Backend (valgfri)
```bash
cd apps/api
npm install
npm run dev      # PORT=8787 default
npm run build && npm start
```
Env:
- `PORT` (default 8787)
- `SEMANTIC_SCHOLAR_API_KEY` (valgfri)
- `USER_AGENT` (for høflige requests)

## Deploy
- GitHub Pages: `npm run build:docs` i `apps/web`, push `docs/`.
- Backend (Render/Fly/etc.): deploy `apps/api` med build `npm run build` og start `npm run start`; sett envs. Deretter bygg frontend med `VITE_API_URL=https://<api-url>` og push `docs/`.

## Nøkler og lagring
- Brukere kan sette API-nøkler (Semantic Scholar m.fl.) via env ved build. UI-støtte for brukerinnlagte nøkler og sikker lagring i browser (f.eks. kryptert med passphrase i `localStorage`) er ikke implementert ennå, men planlagt.

## Dokumentasjon
- `ARCHITECTURE.md` – overblikk
- `LOGBOOK.md` – arbeidslogg
- `TODO.md` – videre arbeid

