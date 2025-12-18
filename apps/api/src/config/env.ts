export const env = {
  port: Number(process.env.PORT ?? 8787),
  semanticScholarKey: process.env.SEMANTIC_SCHOLAR_API_KEY ?? '',
  userAgent:
    process.env.USER_AGENT ??
    'meta-web/0.1 (+https://github.com/meta-web; contact: webmaster@example.com)',
};

