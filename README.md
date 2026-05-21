# Countries-GraphQL-Framework

This framework is an assessment of how to utilize GraphQL onto the Countries API endpoint.

## Setup (new machine)

Requires **Node.js 18+** (native `fetch` and `AbortSignal.timeout`).

```bash
./setup.sh
```

The script verifies Node/npm and installs the GraphQL dependencies (`graphql`, `graphql-request`) into `node_modules/`. It is idempotent — safe to re-run.

If you can't (or don't want to) run the script:

```bash
npm install
```

## Run

```bash
npm run dev       # http://localhost:3000  — serves frontend/ + /api/* proxies
```

## Layout

```
frontend/   UI (HTML + ES modules)
backend/
  api/      GraphQL proxy handlers (countries.js, spacex.js)
  scripts/  dev-server.js — local dev server, mirrors Vercel routing
api/        Vercel-only deployment shims that re-export backend/api/* — leave alone
tests/      Automated test suite (owned separately)
```
