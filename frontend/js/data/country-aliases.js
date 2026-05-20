// The Countries GraphQL API uses formal ISO country names ("United States",
// "Russia", "Marshall Islands"). The SpaceX API returns informal or alternate
// names for the rocket origin country ("USA", "Republic of the Marshall
// Islands", etc.). This map exists ONLY to bridge that naming mismatch.
//
// Everything else in the app — the full country list, ISO codes, flags,
// capitals, continents, currencies, languages — is fetched live from the
// Countries API at boot. Country data is never hardcoded.
//
// Keep entries minimal: add only when SpaceX returns a name that fails the
// dynamic exact-match lookup against the live Countries list.

export const NAME_TO_ISO2 = {
  'united states': 'US',
  'usa': 'US',
  'united states of america': 'US',
  'republic of the marshall islands': 'MH',
  'marshall islands': 'MH',
  'kazakhstan': 'KZ',
  'russia': 'RU',
  'russian federation': 'RU',
  'french guiana': 'GF',
  'new zealand': 'NZ',
  'china': 'CN',
  "people's republic of china": 'CN',
  'india': 'IN',
  'japan': 'JP',
  'south korea': 'KR',
  'korea, republic of': 'KR',
  'north korea': 'KP',
  'iran': 'IR',
  'israel': 'IL',
  'france': 'FR',
  'united kingdom': 'GB',
  'uk': 'GB',
  'great britain': 'GB',
  'australia': 'AU',
  'brazil': 'BR',
};
