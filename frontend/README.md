# frontend/

Single-page web app — **ContinuedX** — built from a [Claude Design](https://claude.ai/design) handoff.

## What it does

Chains two public GraphQL APIs into a flashcard-style quiz:

- **SpaceX GraphQL** — fetches recent launches (mission, rocket, launch site, country).
- **Countries GraphQL** ([trevorblades.com](https://countries.trevorblades.com/)) — enriches the launch country with flag, capital, continent, currency, languages.

Question shown to the user: *"From which country did <mission> lift off?"* — four multiple-choice options, correct answer + three distractors pulled live from the Countries API.

## Run it

The frontend talks to `/api/spacex` and `/api/countries` (serverless proxies in `../api/`), so run both layers together:

```bash
# from the repo root
vercel dev
```

Static-only (without proxies) won't work as-is, because the JS modules call relative `/api/*` URLs that only exist when the Vercel runtime is active.

## Files

- `index.html` — DOM + styles. Loads `js/main.js` as an ES module.
- `js/` — extracted modules:
  - `api.js` — GraphQL client → `/api/spacex`, `/api/countries`
  - `state.js` · `utils.js` · `toasts.js`
  - `quiz.js` · `atlas.js` · `dialog.js`
  - `main.js` — event wiring + `boot()`
  - `data/country-aliases.js` — small SpaceX-name → ISO-code alias map (the only static data; everything else is fetched live)

## Endpoints used (server-side, via proxies)

```
SpaceX:    https://spacex-production.up.railway.app/ (+ 2 mirrors)
Countries: https://countries.trevorblades.com/
```

Mirror fallback for SpaceX runs server-side in `api/spacex.js`.
