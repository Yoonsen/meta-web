# TODO

- [ ] Deploy backend (`apps/api`) to Render/Fly/etc.; set `PORT`, `SEMANTIC_SCHOLAR_API_KEY`, `USER_AGENT`.
- [ ] Rebuild Pages with backend URL: `VITE_API_URL=https://<api-url>` and optionally `VITE_DIRECT_MODE=false`; run `npm run build:docs`.
- [ ] Add retry/backoff for Wikipedia 429 and soften UI error messaging.
- [ ] Optionally proxy arXiv for CORS (tiny worker) or fall back to backend-only for arXiv.
- [ ] Allow user-supplied API keys in UI (Semantic Scholar, future web search).
- [ ] Add another web provider (e.g., Brave/SerpAPI/Tavily) when a key is chosen.
- [ ] Light tests for search orchestration (dedupe/rank) and provider mocks.

