// GraphQL client. Every upstream call now goes through Vercel serverless
// proxies at /api/spacex and /api/countries — same-origin, no CORS surprises
// in prod, and uniform error handling for tests.

const SPACEX_PROXY = '/api/spacex';
const COUNTRIES_PROXY = '/api/countries';

export const SPACEX_QUERY = `query L($limit:Int!){launchesPast(limit:$limit, sort:"launch_date_utc", order:"desc"){
  mission_name launch_date_utc details
  launch_site{ site_name site_name_long }
  rocket{ rocket_name rocket{ country } }
}}`;

export const COUNTRIES_QUERY = `query{countries{ code name emoji capital currency continent{name} languages{name} }}`;

export const COUNTRY_QUERY = `query($code:ID!){country(code:$code){ code name emoji capital currency continent{name} languages{name} }}`;

// Continent → countries → currency chain — exactly the schema traversal used
// by the "which country in <continent> uses <currency>" question type.
export const CONTINENTS_QUERY = `query{continents{ code name countries{ code name emoji capital currency } }}`;

export const CONTINENT_QUERY = `query($code:ID!){continent(code:$code){ code name countries{ code name emoji capital currency } }}`;

async function gqlFetch(url, query, variables = {}, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    if (j.errors) throw new Error(j.errors[0]?.message || 'GraphQL error');
    return j.data;
  } finally {
    clearTimeout(t);
  }
}

export const fetchSpacex = (query, variables) => gqlFetch(SPACEX_PROXY, query, variables);
export const fetchCountries = (query, variables) => gqlFetch(COUNTRIES_PROXY, query, variables);
