// Single in-memory store for the running quiz. No persistence — refresh
// resets everything (per design intent).

export const state = {
  launches: [],
  countries: [],
  continents: [],
  byCode: {},
  launchedCodes: new Set(),
  score: 0,
  asked: 0,
  streak: 0,
  current: null,
  history: [],
  locked: false,
  atlasSample: null,
  dex: { search: '', continent: 'ALL', show: 'all' },
};
