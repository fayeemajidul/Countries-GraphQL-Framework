// Single in-memory store. No persistence — refresh resets everything.

export const state = {
  rockets: [],          // hydrated with .code, .country, .missions
  countriesByCode: {},  // { US: {...}, MH: {...}, ... }
  cart: [],             // rocket ids
};
