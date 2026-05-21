export const endpoints = {
  spacex: process.env.SPACEX_ENDPOINT || 'https://spacex-api.fly.dev/graphql',
  countries: process.env.COUNTRIES_ENDPOINT || 'https://countries.trevorblades.com/',
};

export async function gql(endpoint, query, variables) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });
  const json = await res.json();
  return { status: res.status, json };
}