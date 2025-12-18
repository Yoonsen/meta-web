# Meta Web – Architecture (v0.1)

## Overview
- Two-tier setup: frontend (Vite/React/TS) and optional backend (Express/TS).
- Frontend can run in **direct mode** (no backend) calling public APIs, or via **backend mode** (`/api/search`) for better CORS/control.
- Output for GitHub Pages lives in `docs/`.

## Frontend (`apps/web`)
- Stack: Vite + React + TS, Zustand state.
- Sources: `arxiv`, `wikipedia`, `semanticscholar`.
- Modes:
  - **Direct mode** (default when `VITE_API_URL` is unset): calls providers from browser; falls back to mock on failure. ArXiv may be CORS-blocked; Wikipedia can 429; Semantic Scholar works better with key.
  - **Backend mode**: set `VITE_API_URL=https://api.example.com` and optionally `VITE_DIRECT_MODE=false` to force server.
- Config:
  - `VITE_API_URL` (optional) – backend base.
  - `VITE_DIRECT_MODE` (true/false).
  - `VITE_API_USE_MOCK` (true/false).
  - `VITE_SEMANTIC_SCHOLAR_KEY` (optional).
- Build for Pages: `cd apps/web && npm run build:docs` (writes to `docs/`).

## Backend (`apps/api`)
- Express + TS, NodeNext modules.
- Endpoint: `POST /api/search` fan-out → normalize → dedupe → rank.
- Providers:
  - arXiv (XML, no key; may need proxy for CORS if called client-side).
  - Wikipedia REST (no key; may 429).
  - Semantic Scholar Graph (`x-api-key` optional; without key returns empty).
- Config (`env.ts`):
  - `PORT` (default 8787)
  - `SEMANTIC_SCHOLAR_API_KEY` (optional)
  - `USER_AGENT` (polite fetches)
- Build/start: `npm run build` then `npm start` (reads `PORT`).

## Deployment notes
- GitHub Pages: static files under `docs/`; direct mode suited for no-backend use.
- Backend hosting (e.g., Render/Fly): deploy `apps/api` with Node 18/20, set env vars; expose HTTPS URL; point frontend `VITE_API_URL` to it and rebuild `docs/`.


