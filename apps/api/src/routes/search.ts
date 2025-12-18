import { Router } from 'express';
import { runSearch } from '../core/orchestrator.js';
import type { Profile, SearchRequest } from '../types/search.js';

export const searchRouter = Router();

const fallbackProfile: Profile = {
  preferredLangs: ['en'],
  mainstreamPenalty: 0.2,
  domain: { boost: ['.edu', '.org'] },
};

searchRouter.post('/', async (req, res) => {
  const body = req.body as Partial<SearchRequest>;
  if (!body?.q || typeof body.q !== 'string') {
    return res.status(400).json({ error: 'Missing q' });
  }

  const profile = (body.profile as Profile) ?? fallbackProfile;

  try {
    const response = await runSearch({
      q: body.q,
      page: body.page ?? 1,
      pageSize: body.pageSize ?? 10,
      sources: body.sources ?? [],
      profile,
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

