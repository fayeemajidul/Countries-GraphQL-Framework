// Vercel serverless function: proxies GraphQL POSTs to the SpaceX API.
// Frontend calls /api/spacex with the same { query, variables } body the
// upstream expects. Mirror chain runs server-side so a single browser
// request always sees one consistent origin (no CORS), and we transparently
// fail over if an upstream mirror is down.

const SPACEX_ENDPOINTS = [
  'https://spacex-production.up.railway.app/',
  'https://main--spacex-l4uc6p.apollographos.net/graphql',
  'https://spacex-api.fly.dev/graphql',
];

const TIMEOUT_MS = 9000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!body || !body.query) {
    return res.status(400).json({ error: 'Missing GraphQL query in request body.' });
  }

  let lastError = null;
  for (const url of SPACEX_ENDPOINTS) {
    try {
      const upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!upstream.ok) {
        lastError = new Error(`HTTP ${upstream.status} from ${url}`);
        continue;
      }
      const json = await upstream.json();
      return res.status(200).json(json);
    } catch (err) {
      lastError = err;
    }
  }

  return res.status(502).json({
    error: 'All SpaceX mirrors failed.',
    detail: lastError?.message ?? 'unknown',
  });
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
