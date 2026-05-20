// Question generators. Each returns a normalized question object that quiz.js
// can render without knowing the question type. Every generator exercises a
// different GraphQL traversal so the quiz doubles as a live schema demo.
//
// Shape of a question:
//   {
//     type:            'spacex-country' | 'country-currency' | ...
//     promptHTML:      innerHTML for the question heading
//     metaHTML:        innerHTML shown below the heading (optional)
//     queryLabel:      short text describing the GraphQL traversal used
//     options:         [{ key, label, country? }] — 4 options
//     correctKey:      which option.key is correct
//     revealCountry:   country object shown on the flashcard back face
//     revealContext:   one-line caption above the reveal details (optional)
//   }

import { state } from './state.js';
import { shuffle, escapeHtml, fmtDate, resolveIso } from './utils.js';

const QUESTION_TYPES = [
  'spacex-country',
  'country-currency',
  'country-capital',
  'country-continent',
  'continent-currency',
];

export function pickQuestion() {
  const recent = state.history.slice(-3).map(h => h.type);
  const candidates = QUESTION_TYPES.filter(t => !recent.includes(t));
  const pool = candidates.length ? candidates : QUESTION_TYPES;
  for (let i = 0; i < 8; i++) {
    const type = pool[Math.floor(Math.random() * pool.length)];
    const q = generateQuestion(type);
    if (q) return q;
  }
  return generateQuestion('spacex-country') || generateQuestion('country-capital');
}

function generateQuestion(type) {
  switch (type) {
    case 'spacex-country':     return makeSpaceXCountry();
    case 'country-currency':   return makeCountryCurrency();
    case 'country-capital':    return makeCountryCapital();
    case 'country-continent':  return makeCountryContinent();
    case 'continent-currency': return makeContinentCurrency();
    default: return null;
  }
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function pickRandom(arr) {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

function uniqueByKey(items, keyFn) {
  const seen = new Set();
  return items.filter(it => {
    const k = keyFn(it);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Build distractors of the same shape as the correct answer, drawn from a pool
// keyed by `keyFn`, ensuring distinctness from the correct key.
function pickDistractors(pool, correctKey, keyFn, count = 3) {
  const candidates = shuffle(pool).filter(it => keyFn(it) !== correctKey);
  return uniqueByKey(candidates, keyFn).slice(0, count);
}

/* ── 1. SpaceX → country ──────────────────────────────────────────────────
   GraphQL: launchesPast { rocket { rocket { country } } }  +  countries { … } */
function makeSpaceXCountry() {
  if (!state.launches.length || !state.countries.length) return null;

  const recentMissions = new Set(state.history.slice(-10).map(h => h.mission));
  const pool = state.launches.filter(L => !recentMissions.has(L.mission_name));
  const launch = pickRandom(pool.length ? pool : state.launches);
  if (!launch) return null;

  const code = resolveIso(launch?.rocket?.rocket?.country);
  const correct = state.byCode[code];
  if (!correct) return null;

  const sameCont = state.countries.filter(c => c.code !== correct.code && c.continent?.name === correct.continent?.name);
  const others = state.countries.filter(c => c.code !== correct.code);
  const distractors = uniqueByKey(
    [...shuffle(sameCont).slice(0, 2), ...shuffle(others).slice(0, 4)],
    c => c.code,
  ).slice(0, 3);

  const options = shuffle([correct, ...distractors]).map(c => ({
    key: c.code,
    label: c.name,
    country: c,
  }));

  return {
    type: 'spacex-country',
    promptHTML: `From which country did <span class="italic">${escapeHtml(launch.mission_name || 'this mission')}</span> lift off?`,
    metaHTML: `
      <div class="text-center">
        <div class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">Date</div>
        <div class="mono text-[12px] mt-0.5">${escapeHtml(fmtDate(launch.launch_date_utc))}</div>
      </div>
      <div class="text-center max-w-[28ch]">
        <div class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">Launch site</div>
        <div class="mono text-[12px] mt-0.5">${escapeHtml(launch.launch_site?.site_name_long || launch.launch_site?.site_name || '—')}</div>
      </div>`,
    queryLabel: 'launchesPast → rocket → country',
    options,
    correctKey: correct.code,
    revealCountry: correct,
    revealContext: `${escapeHtml(launch.mission_name || '')} · ${escapeHtml(launch.rocket?.rocket_name || '')}`,
    payload: { mission: launch.mission_name },
  };
}

/* ── 2. Country → currency ───────────────────────────────────────────────
   GraphQL: country(code) { currency } */
function makeCountryCurrency() {
  const eligible = state.countries.filter(c => c.currency && !c.currency.includes(','));
  if (eligible.length < 4) return null;

  const correct = pickRandom(eligible);
  const distractors = pickDistractors(eligible, correct.currency, c => c.currency, 3);
  if (distractors.length < 3) return null;

  const options = shuffle([correct, ...distractors]).map(c => ({
    key: c.currency,
    label: c.currency,
    country: c,
  }));

  return {
    type: 'country-currency',
    promptHTML: `Which currency does <span class="italic">${escapeHtml(correct.name)}</span> use?`,
    metaHTML: countryContextMeta(correct, 'Continent'),
    queryLabel: `country(code: "${correct.code}") → currency`,
    options,
    correctKey: correct.currency,
    revealCountry: correct,
    revealContext: `Currency · ${escapeHtml(correct.currency)}`,
  };
}

/* ── 3. Country → capital ────────────────────────────────────────────────
   GraphQL: country(code) { capital } */
function makeCountryCapital() {
  const eligible = state.countries.filter(c => c.capital);
  if (eligible.length < 4) return null;

  const correct = pickRandom(eligible);
  const distractors = pickDistractors(eligible, correct.capital, c => c.capital, 3);
  if (distractors.length < 3) return null;

  const options = shuffle([correct, ...distractors]).map(c => ({
    key: c.capital,
    label: c.capital,
    country: c,
  }));

  return {
    type: 'country-capital',
    promptHTML: `What is the capital of <span class="italic">${escapeHtml(correct.name)}</span>?`,
    metaHTML: countryContextMeta(correct, 'Continent'),
    queryLabel: `country(code: "${correct.code}") → capital`,
    options,
    correctKey: correct.capital,
    revealCountry: correct,
    revealContext: `Capital · ${escapeHtml(correct.capital)}`,
  };
}

/* ── 4. Country → continent ──────────────────────────────────────────────
   GraphQL: country(code) { continent { name } } */
function makeCountryContinent() {
  const eligible = state.countries.filter(c => c.continent?.name);
  if (eligible.length < 4 || !state.continents.length) return null;

  const correct = pickRandom(eligible);
  const correctContinent = correct.continent.name;

  const otherContinents = uniqueByKey(
    state.continents.filter(c => c.name !== correctContinent),
    c => c.name,
  );
  if (otherContinents.length < 3) return null;
  const distractors = shuffle(otherContinents).slice(0, 3);

  const options = shuffle([{ name: correctContinent }, ...distractors]).map(c => ({
    key: c.name,
    label: c.name,
  }));

  return {
    type: 'country-continent',
    promptHTML: `On which continent is <span class="italic">${escapeHtml(correct.name)}</span>?`,
    metaHTML: countryContextMeta(correct, 'Region clue', { hideContinent: true }),
    queryLabel: `country(code: "${correct.code}") → continent → name`,
    options,
    correctKey: correctContinent,
    revealCountry: correct,
    revealContext: `Continent · ${escapeHtml(correctContinent)}`,
  };
}

/* ── 5. Continent → countries → currency ─────────────────────────────────
   GraphQL: continent(code) { countries { name currency } }
   This is the explicit chain the user wanted demonstrated. */
function makeContinentCurrency() {
  if (!state.continents.length) return null;

  const continentsWithEnoughCountries = state.continents.filter(cont => {
    const usable = (cont.countries || []).filter(c => c.currency && !c.currency.includes(','));
    return usable.length >= 4;
  });
  if (!continentsWithEnoughCountries.length) return null;

  const continent = pickRandom(continentsWithEnoughCountries);
  const continentCountries = (continent.countries || []).filter(c => c.currency && !c.currency.includes(','));

  // Pick a country whose currency is unique within its continent (so distractors
  // can be other countries from the same continent with different currencies).
  const uniqueCurrencyCountries = continentCountries.filter(c =>
    continentCountries.filter(other => other.currency === c.currency).length === 1
  );
  if (uniqueCurrencyCountries.length < 4) return null;

  const correct = pickRandom(uniqueCurrencyCountries);
  const distractors = shuffle(uniqueCurrencyCountries.filter(c => c.code !== correct.code)).slice(0, 3);

  const options = shuffle([correct, ...distractors]).map(c => ({
    key: c.code,
    label: c.name,
    country: state.byCode[c.code] || c,
  }));

  const correctFull = state.byCode[correct.code] || correct;

  return {
    type: 'continent-currency',
    promptHTML: `Which country in <span class="italic">${escapeHtml(continent.name)}</span> uses the currency <span class="italic">${escapeHtml(correct.currency)}</span>?`,
    metaHTML: `
      <div class="text-center">
        <div class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">Continent</div>
        <div class="mono text-[12px] mt-0.5">${escapeHtml(continent.name)}</div>
      </div>
      <div class="text-center">
        <div class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">Currency</div>
        <div class="mono text-[12px] mt-0.5">${escapeHtml(correct.currency)}</div>
      </div>`,
    queryLabel: `continent(code: "${continent.code}") → countries → currency`,
    options,
    correctKey: correct.code,
    revealCountry: correctFull,
    revealContext: `${escapeHtml(continent.name)} · ${escapeHtml(correct.currency)}`,
  };
}

/* ── shared meta block: emoji + name + continent ─────────────────────────── */
function countryContextMeta(country, secondaryLabel = 'Continent', opts = {}) {
  const secondaryValue = opts.hideContinent ? '—' : (country.continent?.name || '—');
  return `
    <div class="text-center">
      <div class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">Country</div>
      <div class="mono text-[12px] mt-0.5">${country.emoji || ''} ${escapeHtml(country.name)}</div>
    </div>
    ${opts.hideContinent ? '' : `
      <div class="text-center">
        <div class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">${escapeHtml(secondaryLabel)}</div>
        <div class="mono text-[12px] mt-0.5">${escapeHtml(secondaryValue)}</div>
      </div>`}`;
}
