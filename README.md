# Countries-GraphQL-Framework


ContinuedX is Amazon shopping list but for spaceships. It chains two public GraphQL APIs through proxies, with a test suite that validates the queries directly against the schemas.

---

## Quick start (new machine)

[![▶ Run setup.sh](https://img.shields.io/badge/▶_Run-setup.sh-22c55e?style=for-the-badge&logo=gnu-bash&logoColor=white)](setup.sh)

```bash
./setup.sh        # verifies Node 18+, runs npm install
npm run dev       # serves the app at http://localhost:3000
```

`./setup.sh` is safe to re-run. If you'd rather skip the script, `npm install` does the same install step.

---

## File structure

```
.
├── frontend/                       Static SPA (HTML + ES modules)
│   ├── index.html                  DOM + styles, loads js/main.js
│   └── js/                         api.js · cards.js · main.js · state.js · store.js · utils.js · data/
│
├── backend/                        Server-side code for the hosted website
│   ├── api/                        GraphQL proxy handlers
│   │   ├── countries.js            POST → countries.trevorblades.com
│   │   └── spacex.js               POST → spacex-api.fly.dev/graphql (mirror failover)
│   └── scripts/
│       └── dev-server.js           Local dev server — mirrors Vercel routing
│
├── api/                            Vercel deployment shims (1 line each, re-export backend/api/*)
│   ├── countries.js                ↳ Vercel auto-detects functions only at /api/ root
│   └── spacex.js
│
├── tests/                          Automated GraphQL test suite
│   ├── helpers/graphql/            graphqlhelper.js — shared fetch + endpoints
│   ├── *.test.js                   Node's built-in test runner
│   └── Scenario_Strategy.md        Strategy doc — which critical areas to lock down
│
├── Assessment-Claude-Prompts/      Chat transcript of the assessment session
├── setup.sh                        New-machine bootstrap
├── package.json                    Dependencies + npm scripts
├── vercel.json                     Hosted deploy config
└── README.md
```

---

## Running the app if you want

```bash
npm run dev       # http://localhost:3000  (frontend + /api/* proxies on one port)
```

The dev server (`backend/scripts/dev-server.js`) serves `frontend/` statically and routes `/api/*` requests through `backend/api/*.js` — same shape as production on Vercel.

---

## Testing the GraphQL endpoints

The suite uses Node's built-in test runner (no Jest/Playwright/etc. needed) and hits the upstream GraphQL APIs directly via a small helper.

```bash
npm test                              # run every tests/**/*.test.js
node --test tests/spacexSchema.test.js   # run a single file
```

**What's tested:**

| File | Purpose |
|---|---|
| `tests/spacexSchema.test.js` | Schema introspection — Rocket type has `id`/`name`/`active`/ `success_rate_pct` with correct GraphQL types |
| `tests/queryOpsForSpaceX.test.js` | Query operation tests against the SpaceX endpoint |
| `tests/errorHandling.test.js` | Failure-mode coverage (bad queries, network edges) |

Strategy and assertion priorities are in [tests/Scenario_Strategy.md](tests/Scenario_Strategy.md).

Override endpoints via env vars if you need to point at a different mirror:

```bash
SPACEX_ENDPOINT=https://your-mirror/graphql npm test
COUNTRIES_ENDPOINT=https://your-mirror npm test
```