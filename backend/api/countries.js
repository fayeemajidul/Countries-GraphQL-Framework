// Vercel serverless function: proxies GraphQL POSTs to the Countries API
// (countries.trevorblades.com). Keeping symmetry with /api/spacex so the
// frontend has one uniform pattern for every upstream call.

const COUNTRIES_ENDPOINT = 'https://countries.trevorblades.com/';
const TIMEOUT_MS = 9000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!body || !body.query) {
    return res.status(400).json({ error: 'Missing GraphQL query in request body.' });
  }

  try {
    const upstream = await fetch(COUNTRIES_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `Countries API responded with HTTP ${upstream.status}`,
      });
    }
    const json = await upstream.json();
    return res.status(200).json(json);
  } catch (err) {
    return res.status(502).json({
      error: 'Countries API request failed.',
      detail: err?.message ?? 'unknown',
    });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
